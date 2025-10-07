import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import failedImage from "@/assets/payment-failed.png";

const SubscriptionFailed = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
                backgroundColor: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#6B7280'][Math.floor(Math.random() * 4)],
                opacity: 0.4
              }}
            />
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-h-screen overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex items-center">
          {/* Failed Card */}
          <Card className="animate-scale-in border-2 border-primary/30 shadow-lg bg-card/95 backdrop-blur overflow-hidden">
            {/* Hero Image Section */}
            <div className="relative w-full h-80 md:h-96 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 -mt-2">
              <img 
                src={failedImage} 
                alt="Payment failed" 
                className="w-full h-full object-contain object-center"
              />
            </div>

            <CardHeader className="text-center pb-2 pt-4">
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                {t('subscriptionFailed.title')}
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {t('subscriptionFailed.subtitle')}
              </p>
            </CardHeader>

            <CardContent className="space-y-3 pb-4">
              {/* Reason */}
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <p className="text-sm text-center text-destructive">
                  {t('subscriptionFailed.reason')}
                </p>
              </div>

              {/* What to do next */}
              <div className="space-y-2 pt-2">
                <h3 className="font-semibold text-center text-sm">
                  {t('subscriptionFailed.nextSteps')}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t('subscriptionFailed.step1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t('subscriptionFailed.step2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t('subscriptionFailed.step3')}</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-3">
                <Button 
                  onClick={() => navigate('/pricing')}
                  className="w-full group"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  {t('subscriptionFailed.tryAgain')}
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {t('subscriptionFailed.goToDashboard')}
                  <ArrowRight className="ml-2 h-3 w-3" />
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
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionFailed;
