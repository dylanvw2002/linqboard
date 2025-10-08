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
    <div className="bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="container mx-auto px-6 py-1 mt-4">
        <div className="flex items-center justify-between -my-[50px]">
          <img src={logo} alt="LinqBoard Logo" className="h-48 w-auto" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button variant="outline" size="lg" className="border-2">
                <LogIn className="mr-2 h-5 w-5" />
                {t('auth.login')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-8 pb-1">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              {t('landing.hero')}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-xl">
              {t('landing.tagline')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth?mode=create">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                  {t('landing.getStarted')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link to="/auth?mode=join">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 w-full sm:w-auto">
                  {t('landing.haveCode')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual Mockup */}
          <div className="relative scale-110">
            <img 
              src={todoBoardIllustration} 
              alt="To-Do Board Illustration" 
              className="w-full h-auto rounded-3xl shadow-2xl"
            />
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full opacity-20 blur-2xl"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 pt-24 pb-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-primary/60 flex items-center justify-center mb-4">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('landing.realtimeTitle')}</h3>
            <p className="text-muted-foreground">
              {t('landing.realtimeDescription')}
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-primary/60 flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('landing.teamManagementTitle')}</h3>
            <p className="text-muted-foreground">
              {t('landing.teamManagementDescription')}
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-primary/60 flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('landing.secureTitle')}</h3>
            <p className="text-muted-foreground">
              {t('landing.secureDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>{t('landing.footerText')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
