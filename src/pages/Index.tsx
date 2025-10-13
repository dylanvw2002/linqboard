import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn, Eye, Edit, Bell, Paperclip, Layout, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import logo from "@/assets/logo-transparent.png";
import todoBoardIllustration from "@/assets/todo-board-illustration.png";
import collaborationIllustration from "@/assets/collaboration-illustration.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import nrgTotaalLogo from "@/assets/partners/nrg-totaal.svg";
import zorgeloosVastgoedLogo from "@/assets/partners/zorgeloos-vastgoed.svg";
import onderhoudscontractenLogo from "@/assets/partners/onderhoudscontracten.png";
import nutribuddiLogo from "@/assets/partners/nutribuddi.png";
import odeaVastgoedLogo from "@/assets/partners/odea-vastgoed.png";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect } from 'react';
const Index = () => {
  const {
    t
  } = useTranslation();
  const demoSection = useScrollAnimation(0.2);
  const featuresSection = useScrollAnimation(0.2);
  const partnersSection = useScrollAnimation(0.2);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start'
  });
  useEffect(() => {
    if (!emblaApi) return;
    const play = () => {
      emblaApi.scrollNext();
    };
    const intervalId = setInterval(play, 3000);
    return () => clearInterval(intervalId);
  }, [emblaApi]);
  const features = [{
    icon: Zap,
    title: t('landing.realtimeTitle'),
    description: t('landing.realtimeDescription')
  }, {
    icon: Users,
    title: t('landing.teamManagementTitle'),
    description: t('landing.teamManagementDescription')
  }, {
    icon: Layout,
    title: 'Aanpasbare Kolommen',
    description: 'Creëer en personaliseer je eigen kolommen met kleuren en achtergronden'
  }, {
    icon: Calendar,
    title: 'Deadlines & Prioriteiten',
    description: 'Stel vervaldatums in en beheer taakprioriteiten met kleurcodes'
  }, {
    icon: Paperclip,
    title: 'Bestanden Bijvoegen',
    description: 'Upload documenten, afbeeldingen en bestanden direct aan je taken'
  }, {
    icon: Shield,
    title: t('landing.secureTitle'),
    description: t('landing.secureDescription')
  }];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": t('seo.home.title'),
    "description": t('seo.home.description'),
    "url": "https://linqboard.nl"
  };
  return <>
      <SEO title={t('seo.home.title')} description={t('seo.home.description')} keywords={t('seo.home.keywords')} canonical="https://linqboard.nl/" structuredData={structuredData} />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <nav className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-8">
                <img src={logo} alt={t('seo.home.logoAlt')} className="h-32 sm:h-40 w-auto hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSwitcher />
                <Link to="/auth">
                  <Button size="default" className="bg-white hover:bg-gray-50 text-foreground border border-gray-200 shadow-sm hover:shadow transition-all text-sm sm:text-base gap-1 sm:gap-2">
                    <LogIn className="h-4 w-4" />
                    {t('auth.login')}
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 sm:px-6 pt-32 sm:pt-36 pb-8 min-h-[85vh] flex items-center">
          <section className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center animate-fade-in w-full">
            {/* Left Content */}
            <article className="space-y-6 sm:space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                {t('landing.hero')}
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-xl">
                {t('landing.tagline')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                

                <Link to="/auth?mode=create" className="w-full sm:w-auto">
                  <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg hover:shadow-xl transition-all w-full">
                    {t('landing.getStarted')}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                
                <Link to="/auth?mode=join" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 w-full">
                    {t('landing.haveCode')}
                  </Button>
                </Link>
              </div>
            </article>

            {/* Right Visual Mockup */}
            <div className="relative scale-105 sm:scale-110">
              <img src={todoBoardIllustration} alt={t('seo.home.heroImageAlt')} className="w-full h-auto rounded-2xl sm:rounded-3xl shadow-2xl" loading="eager" />
              
              {/* Decorative elements */}
              <div className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-primary to-accent rounded-full opacity-20 blur-2xl"></div>
            </div>
          </section>
        </main>

        {/* Demo Section */}
        <section ref={demoSection.ref} className="py-12 sm:py-16 px-4 sm:px-6 min-h-screen flex items-center">
          <div className="container mx-auto max-w-6xl">
            <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-accent p-1 shadow-2xl hover:shadow-xl transition-all duration-700 ease-out ${demoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-card rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Left: Image */}
                  <div className={`rounded-xl overflow-hidden shadow-2xl border border-border/50 transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 -translate-x-0' : 'opacity-0 translate-x-8'}`}>
                    <img src={collaborationIllustration} alt="Linqboard Demo Preview" className="w-full h-auto" />
                  </div>

                  {/* Right: Content */}
                  <div className={`space-y-6 transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {t('landing.demoTitle')}
                    </h2>
                    <p className="text-lg sm:text-xl text-muted-foreground">
                      {t('landing.demoSubtitle')}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{t('landing.demoFeature1')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Edit className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{t('landing.demoFeature2')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Eye className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{t('landing.demoFeature3')}</span>
                      </div>
                    </div>

                    <Link to="/board/demo">
                      <Button size="lg" className="text-lg px-8 h-auto shadow-lg hover:shadow-xl transition-all py-[22px] my-[10px]">
                        {t('landing.demoButton')}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresSection.ref} className="py-12 w-full overflow-hidden relative sm:py-px">
          <p className="text-center text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-6 sm:mb-8">FEATURES</p>
          
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-[60px] bottom-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-[60px] bottom-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Navigation Arrows */}
          <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-2 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110" aria-label="Previous">
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          
          <button onClick={() => emblaApi?.scrollNext()} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-2 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110" aria-label="Next">
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y transition-transform duration-500 ease-out">
              {[...features, ...features, ...features].map((feature, index) => {
              const Icon = feature.icon;
              return <div key={index} className="flex-[0_0_85%] sm:flex-[0_0_340px] min-w-0 pl-4 pr-4 py-4">
                    <article className={`h-full p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.18)] transition-all duration-300 relative overflow-hidden ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{
                  transitionDelay: `${index * 100}ms`
                }}>
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/60 flex items-center justify-center mb-4 shadow-md">
                          <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3">{feature.title}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </article>
                  </div>;
            })}
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section ref={partnersSection.ref} className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className={`bg-muted/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 transition-all duration-700 ease-out ${partnersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-center text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-6 sm:mb-8">
              {t('landing.trustedBy')}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
              {/* NRG Totaal - met logo */}
              <div className="flex items-center justify-center p-4 sm:p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[100px] sm:min-h-[120px]">
                <img src={nrgTotaalLogo} alt="NRG Totaal" className="h-10 sm:h-12 w-auto transition-all" />
              </div>
              
              {/* Zorgeloos Vastgoed - met logo */}
              <div className="flex items-center justify-center p-4 sm:p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[100px] sm:min-h-[120px]">
                <img src={zorgeloosVastgoedLogo} alt="Zorgeloos Vastgoed" className="h-10 sm:h-12 w-auto transition-all" />
              </div>
              
              {/* Onderhoudscontracten.com - met logo */}
              <div className="flex items-center justify-center p-4 sm:p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[100px] sm:min-h-[120px]">
                <img src={onderhoudscontractenLogo} alt="Onderhoudscontracten.com" className="h-16 sm:h-20 w-auto transition-all" />
              </div>
              
              {/* ODÉA Vastgoed Service - met logo */}
              <div className="flex items-center justify-center p-4 sm:p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[100px] sm:min-h-[120px]">
                <img src={odeaVastgoedLogo} alt="ODÉA Vastgoed Service" className="h-24 sm:h-28 w-auto transition-all" />
              </div>
              
              {/* NutriBuddi - met logo */}
              <div className="flex items-center justify-center p-4 sm:p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[100px] sm:min-h-[120px] col-span-2 md:col-span-1">
                <img src={nutribuddiLogo} alt="NutriBuddi" className="h-20 sm:h-24 md:h-28 w-auto transition-all" />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-4 mt-4 sm:mt-[15px]">
          <div className="container mx-auto px-4 sm:px-6 text-center text-sm sm:text-base text-muted-foreground">
            <p>© 2025 LinqBoard. Samen, van to-do naar done.</p>
          </div>
        </footer>
      </div>
    </>;
};
export default Index;