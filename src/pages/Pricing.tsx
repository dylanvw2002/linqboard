import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Plan {
  name: string;
  price: { monthly: number; yearly: number };
  features: string[];
  popular?: boolean;
  plan_id: 'free' | 'pro' | 'team' | 'business';
}

const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          
          const { data: limits } = await supabase.functions.invoke('get-subscription-status');
          if (limits?.limits) {
            setCurrentPlan(limits.limits.plan);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const plans: Plan[] = [
    {
      name: t('pricing.free.name'),
      price: { monthly: 0, yearly: 0 },
      plan_id: 'free',
      features: [
        t('pricing.free.feature1'),
        t('pricing.free.feature2'),
        t('pricing.free.feature3'),
      ]
    },
    {
      name: t('pricing.pro.name'),
      price: { monthly: 7.99, yearly: 79.90 },
      plan_id: 'pro',
      popular: true,
      features: [
        t('pricing.pro.feature1'),
        t('pricing.pro.feature2'),
        t('pricing.pro.feature3'),
        t('pricing.pro.feature4'),
      ]
    },
    {
      name: t('pricing.team.name'),
      price: { monthly: 19.99, yearly: 199.00 },
      plan_id: 'team',
      features: [
        t('pricing.team.feature1'),
        t('pricing.team.feature2'),
        t('pricing.team.feature3'),
        t('pricing.team.feature4'),
      ]
    },
    {
      name: t('pricing.business.name'),
      price: { monthly: 39.00, yearly: 390.00 },
      plan_id: 'business',
      features: [
        t('pricing.business.feature1'),
        t('pricing.business.feature2'),
        t('pricing.business.feature3'),
        t('pricing.business.feature4'),
      ]
    }
  ];

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (plan.plan_id === 'free') {
      toast.info(t('pricing.freeMessage'));
      return;
    }

    setLoading(plan.plan_id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('create-mollie-subscription', {
        body: {
          plan: plan.plan_id,
          billing_interval: isYearly ? 'yearly' : 'monthly'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || t('pricing.subscriptionError'));
    } finally {
      setLoading(null);
    }
  };

  const getButtonText = (plan: Plan) => {
    if (currentPlan === plan.plan_id) {
      return t('pricing.currentPlan');
    }
    if (plan.plan_id === 'free') {
      return user ? t('pricing.downgrade') : t('pricing.getStarted');
    }
    return t('pricing.upgrade');
  };

  const isButtonDisabled = (plan: Plan) => {
    return currentPlan === plan.plan_id || loading !== null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t('pricing.subtitle')}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-4">
              <Label htmlFor="billing-toggle" className={!isYearly ? 'font-bold' : ''}>
                {t('pricing.monthly')}
              </Label>
              <Switch
                id="billing-toggle"
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <Label htmlFor="billing-toggle" className={isYearly ? 'font-bold' : ''}>
                {t('pricing.yearly')}
              </Label>
            </div>
            <span 
              className={`text-sm text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full transition-opacity duration-200 ${
                isYearly ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {t('pricing.save', { percentage: '17' })}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="relative">
                <CardHeader>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : (
            plans.map((plan) => (
            <Card 
              key={plan.plan_id}
              className={`relative ${
                plan.popular 
                  ? 'border-2 border-primary shadow-xl scale-105' 
                  : 'border-border/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  {t('pricing.popular')}
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      €{isYearly ? plan.price.yearly.toFixed(2) : plan.price.monthly.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      /{isYearly ? t('pricing.year') : t('pricing.month')}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isButtonDisabled(plan)}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {loading === plan.plan_id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    getButtonText(plan)
                  )}
                </Button>
              </CardFooter>
            </Card>
          )))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            {t('pricing.footer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
