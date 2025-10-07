import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-transparent.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
interface Plan {
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  popular?: boolean;
  plan_id: 'free' | 'pro' | 'team' | 'business';
}
const Pricing = () => {
  const navigate = useNavigate();
  const {
    t
  } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email || ''
          });
          const {
            data: limits
          } = await supabase.functions.invoke('get-subscription-status');
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
  const plans: Plan[] = [{
    name: t('pricing.free.name'),
    price: {
      monthly: 0,
      yearly: 0
    },
    plan_id: 'free',
    features: [t('pricing.free.feature1'), t('pricing.free.feature2'), t('pricing.free.feature3')]
  }, {
    name: t('pricing.pro.name'),
    price: {
      monthly: 7.99,
      yearly: 79.90
    },
    plan_id: 'pro',
    popular: true,
    features: [t('pricing.pro.feature1'), t('pricing.pro.feature2'), t('pricing.pro.feature3'), t('pricing.pro.feature4')]
  }, {
    name: t('pricing.team.name'),
    price: {
      monthly: 19.99,
      yearly: 199.00
    },
    plan_id: 'team',
    features: [t('pricing.team.feature1'), t('pricing.team.feature2'), t('pricing.team.feature3'), t('pricing.team.feature4')]
  }, {
    name: t('pricing.business.name'),
    price: {
      monthly: 39.00,
      yearly: 390.00
    },
    plan_id: 'business',
    features: [t('pricing.business.feature1'), t('pricing.business.feature2'), t('pricing.business.feature3'), t('pricing.business.feature4')]
  }];
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
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('create-mollie-subscription', {
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
  const getPlanLevel = (planId: string): number => {
    const levels = { free: 0, pro: 1, team: 2, business: 3 };
    return levels[planId as keyof typeof levels] || 0;
  };

  const getButtonText = (plan: Plan) => {
    if (currentPlan === plan.plan_id) {
      return t('pricing.currentPlan');
    }
    
    const currentLevel = getPlanLevel(currentPlan);
    const planLevel = getPlanLevel(plan.plan_id);
    
    if (planLevel > currentLevel) {
      return t('pricing.upgrade');
    } else {
      return t('pricing.downgrade');
    }
  };
  
  const isButtonDisabled = (plan: Plan) => {
    return currentPlan === plan.plan_id || loading !== null;
  };

  const getCardClassName = (plan: Plan) => {
    const baseClasses = "relative transition-all duration-300 hover:[transform:perspective(1000px)_rotateX(2deg)]";
    
    if (plan.plan_id === 'free') {
      return `${baseClasses} border-border/50`;
    }
    
    if (plan.popular) {
      return `${baseClasses} border-2 border-primary shadow-xl scale-105 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 hover:scale-[1.07] hover:shadow-2xl hover:shadow-primary/20`;
    }
    
    if (plan.plan_id === 'team') {
      return `${baseClasses} border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-purple-500/10 to-blue-500/5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20`;
    }
    
    if (plan.plan_id === 'business') {
      return `${baseClasses} border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-yellow-600/10 to-yellow-500/5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/20`;
    }
    
    return `${baseClasses} border-border/50`;
  };

  const getYearlySavings = (plan: Plan) => {
    if (plan.plan_id === 'free' || !isYearly) return null;
    
    const monthlyCost = plan.price.monthly * 12;
    const yearlyCost = plan.price.yearly;
    const savings = (monthlyCost - yearlyCost).toFixed(2);
    
    return savings;
  };

  const getPlanBadge = (plan: Plan) => {
    // Show current plan badge first (highest priority)
    if (currentPlan === plan.plan_id) {
      return (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white hover:bg-green-600">
          {t('pricing.currentPlan')}
        </Badge>
      );
    }
    
    if (plan.plan_id === 'pro' && plan.popular) {
      return (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary/90">
          {t('pricing.badges.bestValue')}
        </Badge>
      );
    }
    
    if (plan.plan_id === 'team') {
      return (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white hover:bg-blue-600">
          {t('pricing.badges.forTeams')}
        </Badge>
      );
    }
    
    if (plan.plan_id === 'business') {
      return (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white hover:bg-yellow-600">
          {t('pricing.badges.enterprise')}
        </Badge>
      );
    }
    
    return null;
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-4 relative">
      {/* Header with back button and language switcher */}
      <header className="container mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container mx-auto px-6 py-4">

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent my-px py-[10px]">
            {t('pricing.title')}
          </h1>
          <p className="text-base text-muted-foreground mb-4">
            {t('pricing.subtitle')}
          </p>

          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="billing-toggle" className={!isYearly ? 'font-bold text-sm' : 'text-sm'}>
                {t('pricing.monthly')}
              </Label>
              <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
              <Label htmlFor="billing-toggle" className={isYearly ? 'font-bold text-sm' : 'text-sm'}>
                {t('pricing.yearly')}
              </Label>
            </div>
            <span className={`text-xs text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full transition-opacity duration-200 ${isYearly ? 'opacity-100' : 'opacity-0'}`}>
              {t('pricing.yearlyBonus')}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {isLoading ?
        // Loading skeletons
        Array.from({
          length: 4
        }).map((_, i) => <Card key={i} className="relative">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    {Array.from({
                length: 4
              }).map((_, j) => <Skeleton key={j} className="h-3 w-full" />)}
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>) : plans.map((plan, index) => <Card 
              key={plan.plan_id} 
              className={`${getCardClassName(plan)} animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {getPlanBadge(plan)}
              
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-foreground">
                      €{isYearly ? plan.price.yearly.toFixed(2) : plan.price.monthly.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      /{isYearly ? t('pricing.year') : t('pricing.month')}
                    </span>
                    {getYearlySavings(plan) && (
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                          {t('pricing.saveAmount').replace('{amount}', getYearlySavings(plan) || '')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-3">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs">{feature}</span>
                    </li>)}
                </ul>
              </CardContent>

              <CardFooter>
                <Button onClick={() => handleSubscribe(plan)} disabled={isButtonDisabled(plan)} className="w-full" size="sm" variant={plan.popular ? 'default' : 'outline'}>
                  {loading === plan.plan_id ? <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      {t('common.loading')}
                    </> : getButtonText(plan)}
                </Button>
              </CardFooter>
            </Card>)}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('pricing.footer')}
          </p>
        </div>
      </div>

      {/* Logo at bottom left */}
      <div className="fixed bottom-2 left-2 z-10">
        <img src={logo} alt="LinqBoard Logo" className="h-48 w-auto" />
      </div>
    </div>;
};
export default Pricing;