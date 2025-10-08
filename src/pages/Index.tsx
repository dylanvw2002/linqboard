import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo-transparent.png";
import todoBoardIllustration from "@/assets/todo-board-illustration.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Index = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="container mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
          <img src={logo} alt="LinqBoard Logo" className="h-24 w-auto" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button variant="outline" size="sm" className="border-2">
                <LogIn className="mr-2 h-4 w-4" />
                {t('auth.login')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {t('landing.hero')}
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-xl">
              {t('landing.tagline')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auth?mode=create">
                <Button size="default" className="px-6 py-2 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                  {t('landing.getStarted')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link to="/auth?mode=join">
                <Button size="default" variant="outline" className="px-6 py-2 border-2 w-full sm:w-auto">
                  {t('landing.haveCode')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual Mockup */}
          <div className="relative">
            <img 
              src={todoBoardIllustration} 
              alt="To-Do Board Illustration" 
              className="w-full h-auto rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <div className="p-4 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-all">
            <div className="w-10 h-10 rounded-lg bg-primary/60 flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold mb-2">{t('landing.realtimeTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.realtimeDescription')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-all">
            <div className="w-10 h-10 rounded-lg bg-primary/60 flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold mb-2">{t('landing.teamManagementTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.teamManagementDescription')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-all">
            <div className="w-10 h-10 rounded-lg bg-primary/60 flex items-center justify-center mb-2">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold mb-2">{t('landing.secureTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.secureDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-4 py-4">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>{t('landing.footerText')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
