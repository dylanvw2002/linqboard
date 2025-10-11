import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import logo from "@/assets/logo-transparent.png";
import todoBoardIllustration from "@/assets/todo-board-illustration.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import nrgTotaalLogo from "@/assets/partners/nrg-totaal.svg";
import zorgeloosVastgoedLogo from "@/assets/partners/zorgeloos-vastgoed.svg";
import onderhoudscontractenLogo from "@/assets/partners/onderhoudscontracten.png";

const Index = () => {
  const { t } = useTranslation();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": t('seo.home.title'),
    "description": t('seo.home.description'),
    "url": "https://linqboard.nl"
  };

  return (
    <>
      <SEO 
        title={t('seo.home.title')}
        description={t('seo.home.description')}
        keywords={t('seo.home.keywords')}
        canonical="https://linqboard.nl/"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        {/* Header */}
        <header className="container mx-auto px-6 py-1 pt-4">
          <nav className="flex items-center justify-between -my-[50px]">
            <img src={logo} alt={t('seo.home.logoAlt')} className="h-48 w-auto" />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link to="/auth">
                <Button variant="outline" size="lg" className="border-2">
                  <LogIn className="mr-2 h-5 w-5" />
                  {t('auth.login')}
                </Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-6 pt-12 pb-1">
          <section className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <article className="space-y-8">
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
            </article>

            {/* Right Visual Mockup */}
            <div className="relative scale-110">
              <img 
                src={todoBoardIllustration} 
                alt={t('seo.home.heroImageAlt')} 
                className="w-full h-auto rounded-3xl shadow-2xl"
                loading="eager"
              />
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full opacity-20 blur-2xl"></div>
            </div>
          </section>
        </main>

        {/* Partners Section */}
        <section className="container mx-auto px-6 py-12">
          <div className="bg-muted/20 rounded-3xl p-8 md:p-12">
            <p className="text-center text-sm uppercase tracking-wider text-muted-foreground mb-8">
              {t('landing.trustedBy')}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
              {/* NRG Totaal - met logo */}
              <div className="flex items-center justify-center p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[120px]">
                <img 
                  src={nrgTotaalLogo} 
                  alt="NRG Totaal" 
                  className="h-12 w-auto transition-all"
                />
              </div>
              
              {/* Onderhoudscontracten.com - met logo */}
              <div className="flex items-center justify-center p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[120px]">
                <img 
                  src={onderhoudscontractenLogo} 
                  alt="Onderhoudscontracten.com" 
                  className="h-12 w-auto transition-all"
                />
              </div>
              
              {/* Zorgeloos Vastgoed - met logo */}
              <div className="flex items-center justify-center p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[120px]">
                <img 
                  src={zorgeloosVastgoedLogo} 
                  alt="Zorgeloos Vastgoed" 
                  className="h-12 w-auto transition-all"
                />
              </div>
              
              {/* ODÉA Vastgoed Service - tekst placeholder */}
              <div className="flex items-center justify-center p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[120px]">
                <span className="text-base md:text-lg font-semibold text-foreground/70 text-center leading-tight">
                  ODÉA Vastgoed Service
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 pt-24 pb-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <article className="p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/60 flex items-center justify-center mb-4">
                <Zap className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold mb-3">{t('landing.realtimeTitle')}</h2>
              <p className="text-muted-foreground">
                {t('landing.realtimeDescription')}
              </p>
            </article>

            <article className="p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/60 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold mb-3">{t('landing.teamManagementTitle')}</h2>
              <p className="text-muted-foreground">
                {t('landing.teamManagementDescription')}
              </p>
            </article>

            <article className="p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/60 flex items-center justify-center mb-4">
                <Shield className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold mb-3">{t('landing.secureTitle')}</h2>
              <p className="text-muted-foreground">
                {t('landing.secureDescription')}
              </p>
            </article>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-4 mt-[15px]">
          <div className="container mx-auto px-6 text-center text-muted-foreground">
            <p>{t('landing.footerText')}</p>
          </div>
        </footer>
      </div>
    </>
  );
};
export default Index;