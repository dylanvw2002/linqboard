import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface SubscriptionLimits {
  plan: string;
  max_organizations: number;
  max_members_per_org: number;
  current_org_count: number;
}

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
  billing_interval: string | null;
}

interface SubscriptionData {
  limits: SubscriptionLimits;
  subscription: Subscription | null;
}

export const useSubscription = () => {
  const [hasSession, setHasSession] = useState<boolean>(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('useSubscription: Initial session check', !!session);
        setHasSession(!!session);

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log('useSubscription: Auth state changed', !!session);
          setHasSession(!!session);
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error('useSubscription: Error initializing auth', error);
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
    queryKey: ['subscription'],
    queryFn: async (): Promise<SubscriptionData> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('get-subscription-status');
      
      if (error) throw error;
      return data;
    },
    enabled: hasSession,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
