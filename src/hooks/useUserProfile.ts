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
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
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
    enabled: hasSession === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};
