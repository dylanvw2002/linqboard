import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import successImage from "@/assets/subscription-success.png";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState<string>('pro');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        const { data } = await supabase.functions.invoke('get-subscription-status');
        
        // Check if subscription is active AND not free plan
        // If it's free, it means the payment failed and was reset
        if (data?.subscription?.status !== 'active' || data?.limits?.plan === 'free') {
          console.log('Payment failed or pending, redirecting to failed page');
          navigate('/subscription-failed');
          return;
        }
        
        if (data?.limits) {
          setPlan(data.limits.plan);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [navigate]);

  const getPlanFeatures = (planName: string) => {
    const features: Record<string, string[]> = {
      pro: [
        t('subscriptionSuccess.pro.feature1'),
        t('subscriptionSuccess.pro.feature2'),
        t('subscriptionSuccess.pro.feature3')
      ],
      team: [
        t('subscriptionSuccess.team.feature1'),
        t('subscriptionSuccess.team.feature2'),
        t('subscriptionSuccess.team.feature3'),
        t('subscriptionSuccess.team.feature4')
      ],
      business: [
        t('subscriptionSuccess.business.feature1'),
        t('subscriptionSuccess.business.feature2'),
        t('subscriptionSuccess.business.feature3'),
        t('subscriptionSuccess.business.feature4')
      ]
    };
    return features[planName] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
        <div className="animate-pulse text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 relative overflow-hidden flex items-center justify-center">
      {/* Animated confetti elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6'][Math.floor(Math.random() * 4)],
                opacity: 0.4
              }}
            />
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-h-screen overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex items-center">
          {/* Success Card */}
          <Card className="w-full animate-scale-in border-2 border-primary/30 shadow-lg bg-card/95 backdrop-blur overflow-hidden">
            {/* Hero Image Section */}
            <div className="relative w-full h-80 md:h-96 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 -mt-2">
              <img 
                src={successImage} 
                alt="Success celebration" 
                className="w-full h-full object-cover object-center scale-110"
              />
            </div>

            <CardHeader className="text-center pb-2 pt-4">
              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('subscriptionSuccess.title')}
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {t('subscriptionSuccess.subtitle')}
              </p>
            </CardHeader>

            <CardContent className="space-y-3 pb-4">
              {/* Plan Badge */}
              <div className="flex justify-center">
                <div className="px-4 py-1 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                  <span className="text-sm font-bold capitalize">
                    {t(`pricing.${plan}.name`)}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-1.5">
                <h3 className="font-semibold text-center text-sm mb-2">
                  {t('subscriptionSuccess.featuresTitle')}
                </h3>
                {getPlanFeatures(plan).slice(0, 3).map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="mt-0.5 rounded-full bg-primary/20 p-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-xs">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-3">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full group"
                  size="sm"
                >
                  {t('subscriptionSuccess.goToDashboard')}
                  <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {t('subscriptionSuccess.viewPlans')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionSuccess;
