import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
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
            <Sparkles 
              className="text-primary/30" 
              size={12 + Math.random() * 20}
            />
          </div>
        ))}
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <Card className="animate-scale-in border-2 border-primary/30 shadow-2xl bg-card/95 backdrop-blur">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('subscriptionSuccess.title')}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {t('subscriptionSuccess.subtitle')}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Plan Badge */}
              <div className="flex justify-center">
                <div className="px-6 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                  <span className="text-lg font-bold capitalize">
                    {t(`pricing.${plan}.name`)}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-center mb-4">
                  {t('subscriptionSuccess.featuresTitle')}
                </h3>
                {getPlanFeatures(plan).map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="mt-0.5 rounded-full bg-primary/20 p-1">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-6">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full group"
                  size="lg"
                >
                  {t('subscriptionSuccess.goToDashboard')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className="w-full"
                >
                  {t('subscriptionSuccess.viewPlans')}
                </Button>
              </div>

              {/* Thank you message */}
              <p className="text-center text-sm text-muted-foreground pt-4 border-t">
                {t('subscriptionSuccess.thankYou')}
              </p>
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
