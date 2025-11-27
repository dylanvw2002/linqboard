import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn, Eye, Edit, Bell, Paperclip, Layout, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import logo from "@/assets/logo-transparent.png";
import linqboardMascot from "@/assets/linqboard-mascot.png";
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
    "@graph": [{
      "@type": "WebPage",
      "name": t('seo.home.title'),
      "description": t('seo.home.description'),
      "url": "https://linqboard.nl",
      "inLanguage": "nl-NL",
      "isPartOf": {
        "@type": "WebSite",
        "url": "https://linqboard.nl"
      }
    }, {
      "@type": "Organization",
      "name": "LinqBoard",
      "url": "https://linqboard.nl",
      "logo": "https://linqboard.nl/logo-linqboard.png",
      "description": "LinqBoard - Het ultieme visuele projectmanagement platform voor teams",
      "foundingDate": "2024",
      "sameAs": ["https://twitter.com/linqboard", "https://linkedin.com/company/linqboard"],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@linqboard.nl"
      }
    }, {
      "@type": "SoftwareApplication",
      "name": "LinqBoard",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "description": "Visueel projectmanagement platform met real-time samenwerking, aanpasbare kolommen en team management",
      "featureList": ["Real-time samenwerking", "Team management", "Aanpasbare kolommen", "Deadline tracking", "Bestandsbijlagen", "Veilige opslag"]
    }, {
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "Wat is LinqBoard?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "LinqBoard is een visueel projectmanagement platform dat teams helpt om efficiënt samen te werken met real-time updates, aanpasbare boards en krachtige samenwerkingstools."
        }
      }, {
        "@type": "Question",
        "name": "Is LinqBoard gratis te gebruiken?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja, LinqBoard biedt een gratis plan waarmee je kunt starten. Voor meer functies zijn er betaalde plannen beschikbaar."
        }
      }, {
        "@type": "Question",
        "name": "Kan ik LinqBoard gebruiken voor team samenwerking?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absoluut! LinqBoard is speciaal ontworpen voor teams met real-time samenwerking, team management functies en veilige data opslag."
        }
      }]
    }]
  };
  return <>
      <SEO title={t('seo.home.title')} description={t('seo.home.description')} keywords={t('seo.home.keywords')} canonical="https://linqboard.nl/" structuredData={structuredData} />
      
      {/* Preload critical images */}
      <link rel="preload" as="image" href={logo} />
      <link rel="preload" as="image" href={linqboardMascot} />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50 bg-white" role="banner">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <nav className="flex items-center justify-between h-16 sm:h-20 lg:h-24" role="navigation" aria-label="Main navigation">
              <div className="flex items-center gap-8">
                <img src={logo} alt="LinqBoard - Visueel Projectmanagement Platform" className="h-32 sm:h-36 lg:h-40 w-auto hover:scale-105 transition-transform duration-300" fetchPriority="high" width="160" height="160" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <LanguageSwitcher />
                <Link to="/auth">
                  <Button size="default" className="bg-white hover:bg-gray-50 text-foreground border border-gray-200 shadow-sm hover:shadow transition-all text-sm sm:text-base gap-1 sm:gap-2 h-10 px-4">
                    <LogIn className="h-4 w-4" />
                    {t('auth.login')}
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-40 xl:pt-44 pb-6 sm:pb-8 lg:pb-12 min-h-[90vh] sm:min-h-[85vh] flex items-center max-w-7xl">
          <section className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 xl:gap-20 items-center animate-fade-in w-full">
            {/* Left Content */}
            <article className="space-y-4 sm:space-y-6 lg:space-y-8 xl:space-y-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t('landing.hero')}
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-xl text-muted-foreground max-w-xl lg:max-w-2xl leading-relaxed">
                {t('landing.tagline')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 pt-2 lg:pt-4">
                <Link to="/auth?mode=create" className="w-full sm:w-auto">
                  <Button size="lg" className="text-base sm:text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all w-full">
                    {t('landing.getStarted')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Link to="/auth?mode=join" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 py-6 border-2 w-full">
                    {t('landing.haveCode')}
                  </Button>
                </Link>
              </div>
            </article>

            {/* Right Visual Mockup */}
            <div className="relative mt-6 lg:mt-0 flex justify-start lg:flex lg:items-start mr-0 ml-0 pr-[110px]">
              <img src={linqboardMascot} alt={t('seo.home.heroImageAlt')} className="w-3/4 lg:w-2/3 h-auto -mt-8" loading="eager" fetchPriority="high" width="800" height="600" />
              
              {/* Decorative elements */}
              
            </div>
          </section>
        </main>

        {/* Demo Section */}
        <section ref={demoSection.ref} className="py-8 sm:py-12 lg:py-20 xl:py-24 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
          <div className="container mx-auto max-w-7xl">
            <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-br from-primary to-accent p-1 shadow-xl sm:shadow-2xl lg:shadow-[0_20px_60px_rgba(0,0,0,0.2)] hover:shadow-xl transition-all duration-700 ease-out ${demoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-card rounded-xl sm:rounded-2xl lg:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 xl:p-20">
                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 xl:gap-20 items-center">
                  {/* Left: Image */}
                  <div className={`rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl border border-border/50 transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 -translate-x-0' : 'opacity-0 translate-x-8'}`}>
                    <img src={collaborationIllustration} alt="Linqboard Demo Preview" className="w-full h-auto" loading="lazy" width="600" height="400" />
                  </div>

                  {/* Right: Content */}
                  <div className={`space-y-4 sm:space-y-6 lg:space-y-8 transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                      {t('landing.demoTitle')}
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl lg:text-xl text-muted-foreground leading-relaxed">
                      {t('landing.demoSubtitle')}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-5">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                        </div>
                        <span className="text-sm sm:text-base lg:text-lg font-medium">{t('landing.demoFeature1')}</span>
                      </div>
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Edit className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                        </div>
                        <span className="text-sm sm:text-base lg:text-lg font-medium">{t('landing.demoFeature2')}</span>
                      </div>
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                        </div>
                        <span className="text-sm sm:text-base lg:text-lg font-medium">{t('landing.demoFeature3')}</span>
                      </div>
                    </div>

                    <Link to="/board/demo" className="block pt-2 lg:pt-4">
                      <Button size="lg" className="text-base sm:text-lg px-8 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
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
        <section ref={featuresSection.ref} className="py-8 sm:py-12 lg:py-20 w-full overflow-hidden relative">
          <p className="text-center text-xs sm:text-sm lg:text-base uppercase tracking-wider text-muted-foreground mb-6 sm:mb-8 lg:mb-12 px-4 font-semibold">FEATURES</p>
          
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
              return <div key={index} className="flex-[0_0_85%] sm:flex-[0_0_80%] md:flex-[0_0_340px] lg:flex-[0_0_380px] min-w-0 pl-2 pr-2 sm:pl-3 sm:pr-3 md:pl-4 md:pr-4 py-3 sm:py-4">
                    <article className={`h-full p-4 sm:p-5 md:p-6 lg:p-10 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgb(0,0,0,0.04)] sm:shadow-[0_4px_12px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.1)] lg:hover:shadow-[0_12px_32px_rgb(0,0,0,0.12)] transition-all duration-300 relative overflow-hidden touch-manipulation animate-fade-in`} style={{
                  animationDelay: `${index % features.length * 100}ms`
                }}>
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl lg:rounded-2xl bg-primary/60 flex items-center justify-center mb-2.5 sm:mb-3 md:mb-4 lg:mb-5 shadow-md">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-white" aria-hidden="true" />
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 leading-snug">{feature.title}</h3>
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed">
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
        <section ref={partnersSection.ref} className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20 max-w-7xl">
          <div className={`bg-muted/20 rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-16 xl:p-20 transition-all duration-700 ease-out ${partnersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-center text-xs sm:text-sm lg:text-base uppercase tracking-wider text-muted-foreground mb-5 sm:mb-6 md:mb-8 lg:mb-12 font-semibold">
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

        {/* Pricing CTA Section */}
        <section className="py-8 sm:py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-br from-primary to-accent p-1 shadow-xl sm:shadow-2xl lg:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="bg-card rounded-xl sm:rounded-2xl lg:rounded-3xl p-8 sm:p-12 md:p-16 lg:p-20 xl:p-24 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 md:mb-10 lg:mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight pb-2">
                Klaar om te beginnen?
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 lg:mb-10 max-w-3xl mx-auto leading-relaxed">
                Kies het plan dat bij jouw team past. Van gratis tot enterprise.
              </p>
              <Link to="/pricing">
                <Button size="lg" className="text-base sm:text-lg lg:text-xl px-8 py-6 sm:px-10 sm:py-7 lg:px-12 lg:py-8 shadow-lg hover:shadow-xl transition-all">
                  Bekijk prijzen
                  <ArrowRight className="ml-2 h-5 w-5 lg:h-6 lg:w-6" />
                </Button>
              </Link>
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