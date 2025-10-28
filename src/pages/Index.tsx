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
    align: 'start',
    containScroll: 'trimSnaps',
    skipSnaps: false,
    duration: 20
  });
  useEffect(() => {
    if (!emblaApi) return;
    const play = () => {
      emblaApi.scrollNext();
    };
    const intervalId = setInterval(play, 5000);
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
    title: t('landing.customColumnsTitle'),
    description: t('landing.customColumnsDescription')
  }, {
    icon: Calendar,
    title: t('landing.deadlinesTitle'),
    description: t('landing.deadlinesDescription')
  }, {
    icon: Paperclip,
    title: t('landing.attachmentsTitle'),
    description: t('landing.attachmentsDescription')
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
      
      {/* Preload critical images */}
      <link rel="preload" as="image" href={logo} />
      <link rel="preload" as="image" href={todoBoardIllustration} />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <nav className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-8">
                <img src={logo} alt={t('seo.home.logoAlt')} className="h-32 sm:h-40 w-auto hover:scale-105 transition-transform duration-300" fetchPriority="high" width="160" height="160" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSwitcher />
                
              </div>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 lg:pt-36 pb-6 sm:pb-8 min-h-[90vh] sm:min-h-[85vh] flex items-center">
          <section className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center animate-fade-in w-full">
            {/* Left Content */}
            <article className="space-y-4 sm:space-y-6 lg:space-y-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                {t('landing.hero')}
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-xl">
                {t('landing.tagline')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <Link to="/auth?mode=create" className="w-full sm:w-auto">
                  <Button size="lg" className="text-base sm:text-lg px-8 py-6 sm:px-8 sm:py-6 shadow-lg hover:shadow-xl transition-all w-full h-14 sm:h-auto">
                    {t('landing.getStarted')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Link to="/auth?mode=join" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 py-6 sm:px-8 sm:py-6 border-2 w-full h-14 sm:h-auto">
                    {t('landing.haveCode')}
                  </Button>
                </Link>
              </div>
            </article>

            {/* Right Visual Mockup */}
            <div className="relative scale-100 sm:scale-105 lg:scale-110 mt-6 lg:mt-0">
              <img src={todoBoardIllustration} alt={t('seo.home.heroImageAlt')} className="w-full h-auto rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl sm:shadow-2xl" loading="eager" fetchPriority="high" width="800" height="600" />
              
              {/* Decorative elements */}
              <div className="absolute -top-3 sm:-top-4 lg:-top-6 -right-3 sm:-right-4 lg:-right-6 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-primary to-accent rounded-full opacity-20 blur-2xl"></div>
            </div>
          </section>
        </main>

        {/* Demo Section */}
        <section ref={demoSection.ref} className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 min-h-screen flex items-center">
          <div className="container mx-auto max-w-6xl">
            <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-br from-primary to-accent p-1 shadow-xl sm:shadow-2xl hover:shadow-xl transition-all duration-700 ease-out ${demoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-card rounded-xl sm:rounded-2xl lg:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16">
                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
                  {/* Left: Image */}
                  <div className={`rounded-xl overflow-hidden shadow-2xl border border-border/50 transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 -translate-x-0' : 'opacity-0 translate-x-8'}`}>
                    <img src={collaborationIllustration} alt="Linqboard Demo Preview" className="w-full h-auto" loading="lazy" width="600" height="400" />
                  </div>

                  {/* Right: Content */}
                  <div className={`space-y-4 sm:space-y-6 transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {t('landing.demoTitle')}
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                      {t('landing.demoSubtitle')}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <span className="text-sm sm:text-sm font-medium">{t('landing.demoFeature1')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Edit className="w-5 h-5 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <span className="text-sm sm:text-sm font-medium">{t('landing.demoFeature2')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Eye className="w-5 h-5 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <span className="text-sm sm:text-sm font-medium">{t('landing.demoFeature3')}</span>
                      </div>
                    </div>

                    <Link to="/board/demo" className="block pt-2">
                      <Button size="lg" className="text-base sm:text-lg px-8 shadow-lg hover:shadow-xl transition-all h-14 sm:h-auto sm:py-6 w-full sm:w-auto">
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
        <section ref={featuresSection.ref} className="py-8 sm:py-12 w-full overflow-hidden relative">
          <p className="text-center text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-6 sm:mb-8 px-4">FEATURES</p>
          
          {/* Gradient Overlays - Hidden on mobile for better visibility */}
          <div className="hidden sm:block absolute left-0 top-[50px] bottom-0 w-20 lg:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="hidden sm:block absolute right-0 top-[50px] bottom-0 w-20 lg:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Navigation Arrows - Better mobile positioning */}
          <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-2 sm:left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white p-2.5 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 touch-manipulation" aria-label="Previous">
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          
          <button onClick={() => emblaApi?.scrollNext()} className="absolute right-2 sm:right-2 lg:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white p-2.5 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 touch-manipulation" aria-label="Next">
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>

          <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="flex touch-pan-y select-none will-change-transform">
              {[...features, ...features, ...features].map((feature, index) => {
              const Icon = feature.icon;
              return <div key={index} className="flex-[0_0_85%] sm:flex-[0_0_80%] md:flex-[0_0_340px] min-w-0 pl-2 pr-2 sm:pl-3 sm:pr-3 md:pl-4 md:pr-4 py-3 sm:py-4">
                    <article className={`h-full p-4 sm:p-5 md:p-6 lg:p-8 rounded-lg sm:rounded-xl md:rounded-2xl bg-card border border-border shadow-[0_2px_8px_rgb(0,0,0,0.04)] sm:shadow-[0_4px_12px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.1)] transition-shadow duration-300 relative overflow-hidden touch-manipulation animate-fade-in`} style={{
                  animationDelay: `${index % features.length * 100}ms`
                }}>
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-primary/60 flex items-center justify-center mb-2.5 sm:mb-3 md:mb-4 shadow-md">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" aria-hidden="true" />
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-1.5 sm:mb-2 md:mb-3 leading-snug">{feature.title}</h3>
                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
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
        <section ref={partnersSection.ref} className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
          <div className={`bg-muted/20 rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 transition-all duration-700 ease-out ${partnersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-center text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-5 sm:mb-6 md:mb-8">
              {t('landing.trustedBy')}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
              {/* NRG Totaal - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px]">
                <img src={nrgTotaalLogo} alt="NRG Totaal" className="h-9 sm:h-10 md:h-12 w-auto transition-all" loading="lazy" width="120" height="48" />
              </div>
              
              {/* Zorgeloos Vastgoed - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px]">
                <img src={nutribuddiLogo} alt="NutriBuddi" className="h-20 sm:h-28 md:h-32 lg:h-36 w-auto transition-all" loading="lazy" width="140" height="112" />
              </div>
              
              {/* Onderhoudscontracten.com - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px]">
                <img src={onderhoudscontractenLogo} alt="Onderhoudscontracten.com" className="h-14 sm:h-16 md:h-20 w-auto transition-all" loading="lazy" width="160" height="80" />
              </div>
              
              {/* ODÉA Vastgoed Service - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px]">
                <img src={odeaVastgoedLogo} alt="ODÉA Vastgoed Service" className="h-20 sm:h-24 md:h-28 w-auto transition-all" loading="lazy" width="120" height="112" />
              </div>
              
              {/* NutriBuddi - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px] col-span-2 md:col-span-1">
                <img src={zorgeloosVastgoedLogo} alt="Zorgeloos Vastgoed" className="h-14 sm:h-20 md:h-24 lg:h-28 w-auto transition-all" loading="lazy" width="120" height="48" />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 sm:py-4 mt-4 sm:mt-[15px]">
          <div className="container mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm md:text-base text-muted-foreground">
            <p>{t('landing.footerText')}</p>
          </div>
        </footer>
      </div>
    </>;
};
export default Index;