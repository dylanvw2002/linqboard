import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<SubscriptionData> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('get-subscription-status');
      
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    enabled: false, // Disabled by default - will be enabled by components when needed
  });
};
