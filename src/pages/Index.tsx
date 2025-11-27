import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn, Eye, Edit, Bell, Paperclip, Layout, Calendar, ChevronLeft, ChevronRight, Clipboard, FileText, Target, Clock, CheckSquare, Archive, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import logo from "@/assets/logo-transparent.png";
import linqboardMascot from "@/assets/linqboard-mascot-new.png";
import collaborationIllustration from "@/assets/collaboration-illustration.png";
import linqboardMascotTry from "@/assets/linqboard-mascot-try.png";
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
        {/* Background Icons Pattern */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Desktop icons - hidden on mobile */}
          <div className="hidden md:block">
            <Calendar className="absolute top-[5%] left-[3%] w-16 h-16 text-primary opacity-5" />
            <Clipboard className="absolute top-[12%] right-[8%] w-20 h-20 text-primary opacity-5" />
            <FileText className="absolute top-[8%] left-[15%] w-14 h-14 text-primary opacity-5" />
            <Target className="absolute top-[18%] right-[20%] w-18 h-18 text-primary opacity-5" />
            <Clock className="absolute top-[25%] left-[5%] w-16 h-16 text-primary opacity-5" />
            <CheckSquare className="absolute top-[15%] left-[45%] w-20 h-20 text-primary opacity-5" />
            <Archive className="absolute top-[22%] right-[35%] w-14 h-14 text-primary opacity-5" />
            <CheckCircle2 className="absolute top-[10%] right-[50%] w-16 h-16 text-primary opacity-5" />
            <Zap className="absolute top-[28%] left-[25%] w-18 h-18 text-primary opacity-5" />
            <Paperclip className="absolute top-[20%] right-[5%] w-14 h-14 text-primary opacity-5" />
            
            <Calendar className="absolute top-[40%] right-[12%] w-20 h-20 text-primary opacity-5" />
            <Clipboard className="absolute top-[45%] left-[10%] w-16 h-16 text-primary opacity-5" />
            <FileText className="absolute top-[38%] right-[40%] w-18 h-18 text-primary opacity-5" />
            <Target className="absolute top-[48%] left-[30%] w-14 h-14 text-primary opacity-5" />
            <Clock className="absolute top-[42%] right-[25%] w-16 h-16 text-primary opacity-5" />
            <CheckSquare className="absolute top-[50%] left-[50%] w-20 h-20 text-primary opacity-5" />
            <Archive className="absolute top-[35%] left-[70%] w-14 h-14 text-primary opacity-5" />
            <CheckCircle2 className="absolute top-[52%] right-[60%] w-18 h-18 text-primary opacity-5" />
            <Zap className="absolute top-[44%] left-[85%] w-16 h-16 text-primary opacity-5" />
            <Paperclip className="absolute top-[38%] left-[65%] w-14 h-14 text-primary opacity-5" />
            
            <Calendar className="absolute top-[65%] left-[8%] w-18 h-18 text-primary opacity-5" />
            <Clipboard className="absolute top-[70%] right-[15%] w-14 h-14 text-primary opacity-5" />
            <FileText className="absolute top-[62%] left-[35%] w-20 h-20 text-primary opacity-5" />
            <Target className="absolute top-[75%] right-[30%] w-16 h-16 text-primary opacity-5" />
            <Clock className="absolute top-[68%] left-[55%] w-14 h-14 text-primary opacity-5" />
            <CheckSquare className="absolute top-[72%] right-[45%] w-18 h-18 text-primary opacity-5" />
            <Archive className="absolute top-[80%] left-[20%] w-20 h-20 text-primary opacity-5" />
            <CheckCircle2 className="absolute top-[78%] right-[8%] w-16 h-16 text-primary opacity-5" />
            <Zap className="absolute top-[85%] left-[75%] w-14 h-14 text-primary opacity-5" />
            <Paperclip className="absolute top-[82%] right-[55%] w-18 h-18 text-primary opacity-5" />
            <Layout className="absolute top-[88%] left-[40%] w-16 h-16 text-primary opacity-5" />
          </div>
          
          {/* Mobile icons - fewer and strategically placed */}
          <div className="block md:hidden">
            <Calendar className="absolute top-[8%] left-[5%] w-14 h-14 text-primary opacity-5" />
            <CheckSquare className="absolute top-[15%] right-[8%] w-16 h-16 text-primary opacity-5" />
            <Target className="absolute top-[25%] left-[75%] w-14 h-14 text-primary opacity-5" />
            <Clock className="absolute top-[35%] right-[10%] w-14 h-14 text-primary opacity-5" />
            <Zap className="absolute top-[45%] left-[8%] w-16 h-16 text-primary opacity-5" />
            <FileText className="absolute top-[55%] right-[12%] w-14 h-14 text-primary opacity-5" />
            <CheckCircle2 className="absolute top-[65%] left-[10%] w-16 h-16 text-primary opacity-5" />
            <Clipboard className="absolute top-[75%] right-[8%] w-14 h-14 text-primary opacity-5" />
            <Archive className="absolute top-[85%] left-[15%] w-14 h-14 text-primary opacity-5" />
            <Paperclip className="absolute top-[92%] right-[10%] w-16 h-16 text-primary opacity-5" />
          </div>
        </div>
        
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50" role="banner">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <nav className="flex items-center justify-between h-16 sm:h-20 lg:h-24" role="navigation" aria-label="Main navigation">
              <div className="flex items-center gap-8">
                <img src={logo} alt="LinqBoard - Visueel Projectmanagement Platform" className="h-32 sm:h-36 lg:h-32 w-auto hover:scale-105 transition-transform duration-300" fetchPriority="high" width="160" height="160" />
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
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-32 xl:pt-36 pb-6 sm:pb-8 lg:pb-10 min-h-[90vh] sm:min-h-[85vh] flex items-center max-w-7xl">
          <section className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center justify-items-center animate-fade-in w-full pl-0 ml-[110px]">
            {/* Left Content */}
            <article className="space-y-6 sm:space-y-8 lg:space-y-6 xl:space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                {t('landing.hero')}
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl text-muted-foreground max-w-xl lg:max-w-xl leading-relaxed">
                {t('landing.tagline')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-4 pt-2 lg:pt-3">
                <Link to="/auth?mode=create" className="w-full sm:w-auto">
                  <Button size="lg" className="text-base sm:text-lg lg:text-base px-8 py-6 lg:py-5 shadow-lg hover:shadow-xl transition-all w-full">
                    {t('landing.getStarted')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Link to="/auth?mode=join" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="text-base sm:text-lg lg:text-base px-8 py-6 lg:py-5 border-2 w-full">
                    {t('landing.haveCode')}
                  </Button>
                </Link>
              </div>
            </article>

            {/* Right Visual Mockup */}
            <div className="relative mt-6 lg:mt-0 flex justify-start mr-0 ml-0 pr-[110px] lg:flex lg:items-start lg:justify-center">
              <img src={linqboardMascot} alt={t('seo.home.heroImageAlt')} className="w-full h-auto -mt-8" loading="eager" fetchPriority="high" width="800" height="600" />
              
              {/* Decorative elements */}
              
            </div>
          </section>
        </main>

        {/* Demo Section */}
        <section ref={demoSection.ref} className="py-8 sm:py-12 lg:py-16 xl:py-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
          <div className="container mx-auto max-w-7xl">
            <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-2xl bg-gradient-to-br from-primary to-accent p-1 shadow-xl sm:shadow-2xl lg:shadow-xl hover:shadow-xl transition-all duration-700 ease-out ${demoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-card rounded-xl sm:rounded-2xl lg:rounded-2xl p-6 sm:p-8 md:p-12 lg:p-12 xl:p-16">
                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center">
                  {/* Left: Image */}
                  <div className={`transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 -translate-x-0' : 'opacity-0 translate-x-8'}`}>
                    <img alt="Linqboard Demo Preview" className="w-3/5 h-auto mx-auto" loading="lazy" width="600" height="400" src="/lovable-uploads/ac8a89e3-1a47-4607-8795-eb1ae4d6a766.png" />
                  </div>

                  {/* Right: Content */}
                  <div className={`space-y-4 sm:space-y-6 lg:space-y-6 transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                      {t('landing.demoTitle')}
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl lg:text-lg text-muted-foreground leading-relaxed">
                      {t('landing.demoSubtitle')}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-4">
                      <div className="flex items-center gap-3 lg:gap-3">
                        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 lg:w-5 lg:h-5 text-primary" />
                        </div>
                        <span className="text-sm sm:text-base lg:text-base font-medium">{t('landing.demoFeature1')}</span>
                      </div>
                      <div className="flex items-center gap-3 lg:gap-3">
                        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Edit className="w-5 h-5 lg:w-5 lg:h-5 text-primary" />
                        </div>
                        <span className="text-sm sm:text-base lg:text-base font-medium">{t('landing.demoFeature2')}</span>
                      </div>
                      <div className="flex items-center gap-3 lg:gap-3">
                        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Eye className="w-5 h-5 lg:w-5 lg:h-5 text-primary" />
                        </div>
                        <span className="text-sm sm:text-base lg:text-base font-medium">{t('landing.demoFeature3')}</span>
                      </div>
                    </div>

                    <Link to="/board/demo" className="block pt-2 lg:pt-3">
                      <Button size="lg" className="text-base sm:text-lg lg:text-base px-8 py-5 lg:py-5 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
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
        <section ref={featuresSection.ref} className="py-8 sm:py-12 lg:py-16 w-full overflow-hidden relative">
          <p className="text-center text-xs sm:text-sm lg:text-sm uppercase tracking-wider text-muted-foreground mb-6 sm:mb-8 lg:mb-10 px-4 font-semibold">FEATURES</p>
          
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
              return <div key={index} className="flex-[0_0_85%] sm:flex-[0_0_80%] md:flex-[0_0_340px] lg:flex-[0_0_320px] min-w-0 pl-2 pr-2 sm:pl-3 sm:pr-3 md:pl-4 md:pr-4 py-3 sm:py-4">
                    <article className={`h-full p-4 sm:p-5 md:p-6 lg:p-7 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-2xl bg-card border border-border shadow-[0_2px_8px_rgb(0,0,0,0.04)] sm:shadow-[0_4px_12px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.1)] lg:hover:shadow-[0_10px_28px_rgb(0,0,0,0.11)] transition-all duration-300 relative overflow-hidden touch-manipulation animate-fade-in`} style={{
                  animationDelay: `${index % features.length * 100}ms`
                }}>
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl lg:rounded-xl bg-primary/60 flex items-center justify-center mb-2.5 sm:mb-3 md:mb-4 lg:mb-4 shadow-md">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-7 lg:w-7 text-white" aria-hidden="true" />
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl font-semibold mb-1.5 sm:mb-2 md:mb-3 lg:mb-3 leading-snug">{feature.title}</h3>
                        <p className="text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground leading-relaxed">
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
        <section ref={partnersSection.ref} className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-7xl">
          <div className={`bg-muted/20 rounded-xl sm:rounded-2xl lg:rounded-2xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 transition-all duration-700 ease-out ${partnersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-center text-xs sm:text-sm lg:text-sm uppercase tracking-wider text-muted-foreground mb-5 sm:mb-6 md:mb-8 lg:mb-10 font-semibold">
              {t('landing.trustedBy')}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 lg:gap-6 max-w-7xl mx-auto">
              {/* NRG Totaal - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-5 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px] lg:min-h-[110px]">
                <img src={nrgTotaalLogo} alt="NRG Totaal" className="h-9 sm:h-10 md:h-12 lg:h-10 w-auto transition-all" loading="lazy" width="120" height="48" />
              </div>
              
              {/* Zorgeloos Vastgoed - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-5 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px] lg:min-h-[110px]">
                <img src={nutribuddiLogo} alt="NutriBuddi" className="h-20 sm:h-28 md:h-32 lg:h-28 w-auto transition-all" loading="lazy" width="140" height="112" />
              </div>
              
              {/* Onderhoudscontracten.com - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-5 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px] lg:min-h-[110px]">
                <img src={onderhoudscontractenLogo} alt="Onderhoudscontracten.com" className="h-14 sm:h-16 md:h-20 lg:h-16 w-auto transition-all" loading="lazy" width="160" height="80" />
              </div>
              
              {/* ODÉA Vastgoed Service - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-5 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px] lg:min-h-[110px]">
                <img src={odeaVastgoedLogo} alt="ODÉA Vastgoed Service" className="h-20 sm:h-24 md:h-28 lg:h-24 w-auto transition-all" loading="lazy" width="120" height="112" />
              </div>
              
              {/* NutriBuddi - met logo */}
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-5 bg-card rounded-lg sm:rounded-xl border border-border hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-100 min-h-[90px] sm:min-h-[100px] md:min-h-[120px] lg:min-h-[110px] col-span-2 md:col-span-1">
                <img src={zorgeloosVastgoedLogo} alt="Zorgeloos Vastgoed" className="h-14 sm:h-20 md:h-24 lg:h-20 w-auto transition-all" loading="lazy" width="120" height="48" />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing CTA Section */}
        <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-2xl bg-gradient-to-br from-primary to-accent p-1 shadow-xl sm:shadow-2xl lg:shadow-xl">
            <div className="bg-card rounded-xl sm:rounded-2xl lg:rounded-2xl p-8 sm:p-12 md:p-16 lg:p-16 xl:p-20 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-6 sm:mb-8 md:mb-10 lg:mb-10 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight pb-2">
                Klaar om te beginnen?
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-lg text-muted-foreground mb-6 sm:mb-8 lg:mb-8 max-w-3xl mx-auto leading-relaxed">
                Kies het plan dat bij jouw team past. Van gratis tot enterprise.
              </p>
              <Link to="/pricing">
                <Button size="lg" className="text-base sm:text-lg lg:text-base px-8 py-6 sm:px-10 sm:py-7 lg:px-10 lg:py-6 shadow-lg hover:shadow-xl transition-all">
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