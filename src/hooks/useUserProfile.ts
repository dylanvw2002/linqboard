import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export const useUserProfile = () => {
  const [hasSession, setHasSession] = useState<boolean>(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('useUserProfile: Initial session check', !!session);
        setHasSession(!!session);

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log('useUserProfile: Auth state changed', !!session);
          setHasSession(!!session);
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error('useUserProfile: Error initializing auth', error);
        setHasSession(false);
      }
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async (): Promise<UserProfile> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;

      return {
        id: session.user.id,
        email: session.user.email || '',
        full_name: profile?.full_name || '',
        avatar_url: profile?.avatar_url,
      };
    },
    enabled: hasSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};
