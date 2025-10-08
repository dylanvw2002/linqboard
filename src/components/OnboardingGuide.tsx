import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, Users, Rocket, ChevronRight, ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OnboardingGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingGuide({ open, onOpenChange }: OnboardingGuideProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleClose = () => {
    localStorage.setItem('onboarding_completed_v1', 'true');
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleGetStarted = (path: string) => {
    handleClose();
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-card via-card to-primary/5">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {step === 1 && (
              <>
                <PartyPopper className="h-6 w-6 text-primary" />
                {t('onboarding.welcome')}
              </>
            )}
            {step === 2 && (
              <>
                <Users className="h-6 w-6 text-primary" />
                {t('onboarding.step2Title')}
              </>
            )}
            {step === 3 && (
              <>
                <Rocket className="h-6 w-6 text-primary" />
                {t('onboarding.step3Title')}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('onboarding.welcomeDescription')}</span>
              <span>{step}/{totalSteps}</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>

          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <PartyPopper className="h-10 w-10 text-primary" />
                </div>
              </div>
              <p className="text-center text-lg text-muted-foreground leading-relaxed">
                {t('onboarding.step1Description')}
              </p>
            </div>
          )}

          {/* Step 2: Organizations */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
              </div>
              <p className="text-center text-lg text-muted-foreground leading-relaxed">
                {t('onboarding.step2Description')}
              </p>
            </div>
          )}

          {/* Step 3: Get Started */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Rocket className="h-10 w-10 text-primary" />
                </div>
              </div>
              <p className="text-center text-lg text-muted-foreground mb-6">
                {t('onboarding.step3Description')}
              </p>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full text-lg py-6"
                  onClick={() => handleGetStarted('/create-organization')}
                >
                  {t('onboarding.createFirstOrg')}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg py-6"
                  onClick={() => handleGetStarted('/join-organization')}
                >
                  {t('onboarding.joinWithCode')}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            {t('onboarding.skip')}
          </Button>

          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t('onboarding.previous')}
              </Button>
            )}
            {step < totalSteps && (
              <Button onClick={handleNext}>
                {t('onboarding.next')}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Optional: Don't show again checkbox */}
        <div className="text-center">
          <button
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('onboarding.dontShowAgain')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
