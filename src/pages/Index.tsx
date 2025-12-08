import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn, Eye, Edit, Bell, Paperclip, Layout, Calendar, Clipboard, FileText, Target, Clock, CheckSquare, Archive, CheckCircle2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import logo from "@/assets/logo-transparent.png";
import linqboardMascot from "@/assets/linqboard-mascot-with-logo.png";
import linqboardMascotNoLogo from "@/assets/linqboard-mascot-new.png";
import linqboardMascotChair from "@/assets/linqboard-mascot-chair.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import nrgTotaalLogo from "@/assets/partners/nrg-totaal.svg";
import zorgeloosVastgoedLogo from "@/assets/partners/zorgeloos-vastgoed.svg";
import onderhoudscontractenLogo from "@/assets/partners/onderhoudscontracten.png";
import nutribuddiLogo from "@/assets/partners/nutribuddi.png";
import odeaVastgoedLogo from "@/assets/partners/odea-vastgoed.png";
import fleatureLogo from "@/assets/partners/fleature.png";
import sololinqLogo from "@/assets/partners/sololinq.png";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState, useEffect, useCallback } from "react";
import { BackgroundIcons } from "@/components/landing/BackgroundIcons";
import type { CarouselApi } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const {
    t
  } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  
  // Carousel API refs
  const [featuresApi, setFeaturesApi] = useState<CarouselApi>();
  const [partnersApi, setPartnersApi] = useState<CarouselApi>();
  
  // Swipe state for features carousel
  const [featuresSwipeStartX, setFeaturesSwipeStartX] = useState<number>(0);
  const [featuresSwipeStartY, setFeaturesSwipeStartY] = useState<number>(0);
  const [featuresSwiping, setFeaturesSwiping] = useState(false);
  
  // Swipe state for partners carousel
  const [partnersSwipeStartX, setPartnersSwipeStartX] = useState<number>(0);
  const [partnersSwipeStartY, setPartnersSwipeStartY] = useState<number>(0);
  const [partnersSwiping, setPartnersSwiping] = useState(false);
  
  // Current slide tracking
  const [featuresCurrentSlide, setFeaturesCurrentSlide] = useState(0);
  const [partnersCurrentSlide, setPartnersCurrentSlide] = useState(0);
  
  const demoSection = useScrollAnimation(0.2);
  const featuresSection = useScrollAnimation(0.2);
  const partnersSection = useScrollAnimation(0.2);
  
  // Create autoplay plugins
  const partnersAutoplayPlugin = useRef(Autoplay({
    delay: 4000,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
    stopOnFocusIn: false
  }));
  
  const featuresAutoplayPlugin = useRef(Autoplay({
    delay: 4000,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
    stopOnFocusIn: false
  }));

  // Pause autoplay during scroll to prevent jank
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolling(true);
          partnersAutoplayPlugin.current?.stop();
          featuresAutoplayPlugin.current?.stop();
          
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          
          scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
            partnersAutoplayPlugin.current?.play();
            featuresAutoplayPlugin.current?.play();
          }, 150);
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // Listen to carousel changes
  useEffect(() => {
    if (!featuresApi) return;
    
    const onSelect = () => {
      setFeaturesCurrentSlide(featuresApi.selectedScrollSnap());
    };
    
    featuresApi.on("select", onSelect);
    onSelect();
    
    return () => {
      featuresApi.off("select", onSelect);
    };
  }, [featuresApi]);
  
  useEffect(() => {
    if (!partnersApi) return;
    
    const onSelect = () => {
      setPartnersCurrentSlide(partnersApi.selectedScrollSnap());
    };
    
    partnersApi.on("select", onSelect);
    onSelect();
    
    return () => {
      partnersApi.off("select", onSelect);
    };
  }, [partnersApi]);
  
  // Swipe handlers for features carousel
  const handleFeaturesSwipeStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || e.touches.length !== 1) return;
    setFeaturesSwipeStartX(e.touches[0].clientX);
    setFeaturesSwipeStartY(e.touches[0].clientY);
    setFeaturesSwiping(true);
  }, [isMobile]);
  
  const handleFeaturesSwipeMove = useCallback((e: React.TouchEvent) => {
    if (!featuresSwiping || e.touches.length !== 1) return;
    
    const deltaX = e.touches[0].clientX - featuresSwipeStartX;
    const deltaY = e.touches[0].clientY - featuresSwipeStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
  }, [featuresSwiping, featuresSwipeStartX, featuresSwipeStartY]);
  
  const handleFeaturesSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!featuresSwiping || !featuresApi) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - featuresSwipeStartX;
    const deltaY = touch.clientY - featuresSwipeStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        featuresApi.scrollPrev();
      } else {
        featuresApi.scrollNext();
      }
    }
    
    setFeaturesSwiping(false);
  }, [featuresSwiping, featuresApi, featuresSwipeStartX, featuresSwipeStartY]);
  
  // Swipe handlers for partners carousel
  const handlePartnersSwipeStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || e.touches.length !== 1) return;
    setPartnersSwipeStartX(e.touches[0].clientX);
    setPartnersSwipeStartY(e.touches[0].clientY);
    setPartnersSwiping(true);
  }, [isMobile]);
  
  const handlePartnersSwipeMove = useCallback((e: React.TouchEvent) => {
    if (!partnersSwiping || e.touches.length !== 1) return;
    
    const deltaX = e.touches[0].clientX - partnersSwipeStartX;
    const deltaY = e.touches[0].clientY - partnersSwipeStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
  }, [partnersSwiping, partnersSwipeStartX, partnersSwipeStartY]);
  
  const handlePartnersSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!partnersSwiping || !partnersApi) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - partnersSwipeStartX;
    const deltaY = touch.clientY - partnersSwipeStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        partnersApi.scrollPrev();
      } else {
        partnersApi.scrollNext();
      }
    }
    
    setPartnersSwiping(false);
  }, [partnersSwiping, partnersApi, partnersSwipeStartX, partnersSwipeStartY]);
  
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
      "name": "LinqBoard - Visueel Projectmanagement voor Teams",
      "description": "Beheer taken, werk in real-time samen en houd je team gesynchroniseerd met LinqBoard. Het moderne taakbeheertool voor efficiënte teams.",
      "url": "https://linqboard.io",
      "inLanguage": "nl-NL",
      "isPartOf": {
        "@type": "WebSite",
        "url": "https://linqboard.io"
      }
    }, {
      "@type": "Organization",
      "name": "LinqBoard",
      "url": "https://linqboard.io",
      "logo": "https://linqboard.io/logo-linqboard.png",
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
      <SEO title={t('seo.home.title')} description={t('seo.home.description')} keywords={t('seo.home.keywords')} canonical="https://linqboard.io/" structuredData={structuredData} />
      
      {/* Preload critical images */}
      <link rel="preload" as="image" href={logo} />
      <link rel="preload" as="image" href={linqboardMascot} fetchPriority="high" />
      <link rel="preload" as="image" href={linqboardMascotNoLogo} fetchPriority="high" />
      
      <div className="min-h-[100dvh] bg-background md:bg-gradient-to-br md:from-background md:via-primary/5 md:to-accent/5 overflow-x-hidden pb-20">
        {/* Background Icons Pattern - Lazy loaded with Intersection Observer */}
        <BackgroundIcons />
        
        {/* Header - responsive */}
        <header className="absolute top-0 left-0 right-0 z-50" role="banner">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
            <nav className="flex items-center justify-between h-14 sm:h-16 md:h-20 lg:h-24 xl:h-28" role="navigation" aria-label="Main navigation">
              <div className="flex items-center gap-3 sm:gap-8">
                <div className="sm:hidden">
                  <LanguageSwitcher />
                </div>
                <img src={logo} alt="LinqBoard - Visueel Projectmanagement Platform" className="hidden sm:block h-32 sm:h-36 md:h-40 lg:h-44 xl:h-48 w-auto hover:scale-105 transition-transform duration-300" fetchPriority="high" width="160" height="160" decoding="async" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                <div className="hidden sm:block">
                  <LanguageSwitcher />
                </div>
                <Link to="/auth">
                  <Button size="default" className="bg-white hover:bg-gray-50 text-foreground border border-gray-200 shadow-sm hover:shadow transition-all text-xs sm:text-sm md:text-base lg:text-lg gap-2 h-8 sm:h-9 md:h-10 lg:h-11 px-3 sm:px-4 lg:px-5">
                    <LogIn className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                    {t('auth.login')}
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero Section - responsive */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 xl:pt-40 2xl:pt-48 pb-6 sm:pb-8 lg:pb-12 xl:pb-16 min-h-[100dvh] flex items-center max-w-[1920px]">
          <section className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-8 xl:gap-10 2xl:gap-12 items-center justify-items-center animate-fade-in w-full">
            {/* Left Content - responsive text */}
            <article className="space-y-4 sm:space-y-6 md:space-y-7 lg:space-y-6 xl:space-y-7 2xl:space-y-8 text-center lg:text-left lg:ml-8 xl:ml-16 2xl:ml-32">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold leading-tight">
                {t('landing.heroTitle1')} <span className="text-primary">{t('landing.heroTitle2')}</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl 2xl:text-2xl text-muted-foreground max-w-xl lg:max-w-2xl xl:max-w-3xl leading-relaxed mx-auto lg:mx-0">
                {t('landing.tagline')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-4 xl:gap-5 pt-2 lg:pt-3 xl:pt-4 justify-center lg:justify-start">
                <Link to="/auth?mode=create" className="w-full sm:w-auto">
                  <Button size="lg" className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg 2xl:text-xl px-6 sm:px-8 lg:px-8 xl:px-10 py-4 sm:py-5 lg:py-5 xl:py-6 shadow-lg hover:shadow-xl transition-all w-full">
                    {t('landing.getStarted')}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                  </Button>
                </Link>
                
                <Link to="/auth?mode=join" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg 2xl:text-xl px-6 sm:px-8 lg:px-8 xl:px-10 py-4 sm:py-5 lg:py-5 xl:py-6 border-2 w-full">
                    {t('landing.haveCode')}
                  </Button>
                </Link>
              </div>
            </article>

            {/* Right Visual Mockup - responsive images */}
            <div className="relative -mt-4 sm:-mt-6 lg:-mt-8 xl:-mt-10 flex justify-center items-center order-first lg:order-last">
              <img src={linqboardMascot} alt={t('seo.home.heroImageAlt')} className="w-1/2 sm:w-2/5 md:hidden h-auto" fetchPriority="high" width="800" height="600" decoding="async" />
              <img src={linqboardMascotNoLogo} alt={t('seo.home.heroImageAlt')} className="hidden md:block md:w-1/2 lg:w-1/2 xl:w-3/5 2xl:w-2/3 h-auto" fetchPriority="high" width="800" height="600" decoding="async" />
              
              {/* Decorative elements */}
              
            </div>
          </section>
        </main>

        {/* Features Section - responsive */}
        <section ref={featuresSection.ref} className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 mt-0 min-h-[100dvh] flex flex-col justify-center">
          <div className="container mx-auto max-w-[1920px]">
            {/* Header - responsive text */}
            <div className={`text-center mb-8 sm:mb-12 md:mb-16 lg:mb-16 xl:mb-18 transition-all duration-700 ease-out ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-xs sm:text-sm lg:text-sm xl:text-base uppercase tracking-wider text-primary mb-3 sm:mb-4 lg:mb-4 font-semibold">
                {t('landing.featuresLabel').toUpperCase()}
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-4">
                {t('landing.featuresTitle')}
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl text-muted-foreground max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
                {t('landing.featuresDescription')}
              </p>
            </div>

            {/* Features Grid - Desktop - responsive cards */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-6 xl:gap-8">
              {features.map((feature, index) => {
              const Icon = feature.icon;
              return <article key={index} className={`group relative bg-card rounded-2xl p-5 sm:p-6 lg:p-6 xl:p-8 border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{
                animationDelay: `${index * 100}ms`
              }}>
                    {/* Gradient Background on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon - responsive */}
                      <div className="mb-4 sm:mb-5 lg:mb-5 xl:mb-6 relative">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500">
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-white" aria-hidden="true" />
                        </div>
                        {/* Glow Effect */}
                        <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-xl bg-gradient-to-br from-primary to-accent blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                      </div>

                      {/* Text - responsive */}
                      <h3 className="text-base sm:text-lg lg:text-lg xl:text-xl font-bold mb-2 sm:mb-3 lg:mb-3 group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base lg:text-base xl:text-lg text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-20 lg:h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </article>;
            })}
            </div>

            {/* Features Carousel - Mobile */}
            <div className="md:hidden px-4">
              <div
                onTouchStart={handleFeaturesSwipeStart}
                onTouchMove={handleFeaturesSwipeMove}
                onTouchEnd={handleFeaturesSwipeEnd}
              >
                <Carousel 
                  setApi={setFeaturesApi}
                  opts={{
                    align: "center",
                    loop: true,
                    watchDrag: true,
                    dragFree: false
                  }} 
                  plugins={[featuresAutoplayPlugin.current]} 
                  className="w-full"
                >
                  <CarouselContent className="ml-0">
                    {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return <CarouselItem key={index} className="pl-0 basis-full">
                          <article className={`group relative bg-card rounded-2xl p-6 border border-border transition-all duration-500 h-[340px] flex flex-col ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ contain: 'layout style paint' }}>
                            {/* Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl" />
                            
                            {/* Content */}
                            <div className="relative z-10 flex flex-col h-full justify-between">
                              {/* Icon */}
                              <div className="mb-4 relative flex-shrink-0">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                                  <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                                </div>
                              </div>

                              {/* Text */}
                              <div className="flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-3 flex-shrink-0">
                                  {feature.title}
                                </h3>
                                <p className="text-base text-muted-foreground leading-relaxed">
                                  {feature.description}
                                </p>
                              </div>
                            </div>

                            {/* Corner Accent */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                          </article>
                        </CarouselItem>;
                  })}
                  </CarouselContent>
                <CarouselPrevious className="hidden lg:flex" />
                <CarouselNext className="hidden lg:flex" />
                </Carousel>
              </div>
              
              {/* Swipe dots indicator */}
              {!isMobile && (
                <div className="lg:hidden flex justify-center gap-2 mt-4">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => featuresApi?.scrollTo(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === featuresCurrentSlide
                          ? 'w-8 bg-primary'
                          : 'w-2 bg-muted-foreground/30'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              {isMobile && (
                <div className="flex justify-center gap-2 mt-4">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => featuresApi?.scrollTo(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === featuresCurrentSlide
                          ? 'w-8 bg-primary'
                          : 'w-2 bg-muted-foreground/30'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Testimonial Quotes Section - responsive */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 md:py-10 lg:py-10 xl:py-12 max-w-[1920px]">
          {/* Header - responsive */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-10 xl:mb-12">
            <p className="text-xs sm:text-sm lg:text-sm xl:text-base uppercase tracking-wider text-primary mb-3 sm:mb-4 lg:mb-4 font-semibold">
              {t('landing.testimonialsLabel').toUpperCase()}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-4">
              {t('landing.testimonialsTitle')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl text-muted-foreground max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
              {t('landing.testimonialsDescription')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 lg:gap-5 xl:gap-6">
            {/* Quote 1 - NRG Totaal - responsive */}
            <div className="relative h-full">
              <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-6 xl:p-8 border border-border shadow-lg h-full flex flex-col">
                {/* Quote Content */}
                <div className="space-y-3 sm:space-y-4 lg:space-y-4 flex-1 flex flex-col">
                  <blockquote className="text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl font-medium text-foreground leading-relaxed italic flex-1">
                    <span className="text-purple-500 text-4xl sm:text-5xl lg:text-5xl font-serif mr-2">"</span>{t('landing.testimonial1')}
                  </blockquote>
                  
                  {/* Attribution - responsive */}
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-3 pt-2 sm:pt-3 border-t border-border/50">
                    <img src={nrgTotaalLogo} alt="NRG Totaal logo" className="h-6 sm:h-7 lg:h-7 xl:h-8 w-auto opacity-80" loading="lazy" decoding="async" />
                    <div>
                      <p className="font-semibold text-xs sm:text-sm lg:text-sm xl:text-base text-foreground">{t('landing.testimonial1Company')}</p>
                      <p className="text-[10px] sm:text-xs lg:text-xs text-muted-foreground">{t('landing.testimonial1Role')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote 2 - Zorgeloos Vastgoed - responsive */}
            <div className="relative h-full">
              <div className="bg-gradient-to-br from-card via-card to-accent/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-6 xl:p-8 border border-border shadow-lg h-full flex flex-col">
                {/* Quote Content */}
                <div className="space-y-3 sm:space-y-4 lg:space-y-4 flex-1 flex flex-col">
                  <blockquote className="text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl font-medium text-foreground leading-relaxed italic flex-1">
                    <span className="text-purple-500 text-4xl sm:text-5xl lg:text-5xl font-serif mr-2">"</span>{t('landing.testimonial2')}
                  </blockquote>
                  
                  {/* Attribution - responsive */}
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-3 pt-2 sm:pt-3 border-t border-border/50">
                    <img src={zorgeloosVastgoedLogo} alt="Zorgeloos Vastgoed BV logo" className="h-6 sm:h-7 lg:h-7 xl:h-8 w-auto opacity-80" loading="lazy" decoding="async" />
                    <div>
                      <p className="font-semibold text-xs sm:text-sm lg:text-sm xl:text-base text-foreground">{t('landing.testimonial2Company')}</p>
                      <p className="text-[10px] sm:text-xs lg:text-xs text-muted-foreground">{t('landing.testimonial2Role')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section - responsive */}
        <section ref={demoSection.ref} className="py-8 sm:py-12 md:py-16 lg:py-16 xl:py-20 2xl:py-24 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 min-h-screen flex items-center w-full">
          <div className="w-full max-w-[1920px] mx-auto">
            <div className={`grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-8 xl:gap-12 2xl:gap-16 items-center transition-all duration-700 ease-out ${demoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  {/* Left: Image - responsive */}
                  <div className={`transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 -translate-x-0' : 'opacity-0 translate-x-8'}`}>
                    <img alt="Linqboard Demo Preview" className="w-2/5 sm:w-1/3 lg:w-1/3 xl:w-2/5 2xl:w-1/2 h-auto mx-auto" loading="lazy" width="600" height="400" src={linqboardMascotChair} decoding="async" />
                  </div>

                  {/* Right: Content - responsive */}
                  <div className={`space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-5 xl:space-y-6 transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                      {t('landing.demoTitle')}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl text-muted-foreground leading-relaxed">
                      {t('landing.demoSubtitle')}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 lg:gap-4">
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-primary" />
                        </div>
                        <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl font-medium">{t('landing.demoFeature1')}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Edit className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-primary" />
                        </div>
                        <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl font-medium">{t('landing.demoFeature2')}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-primary" />
                        </div>
                        <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl font-medium">{t('landing.demoFeature3')}</span>
                      </div>
                    </div>

                    <Link to="/board/demo" className="block pt-2 sm:pt-3 lg:pt-3">
                      <Button size="lg" className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg px-6 sm:px-8 lg:px-8 py-4 sm:py-5 lg:py-5 xl:py-6 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                        {t('landing.demoButton')}
                        <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                      </Button>
                    </Link>
                </div>
              </div>
            </div>
          </section>

        {/* Partners Section - responsive */}
        <section ref={partnersSection.ref} className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-10 md:py-12 lg:py-12 xl:py-16 max-w-[1920px]">
          <div className={`bg-muted/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-6 xl:p-10 2xl:p-12 transition-all duration-700 ease-out ${partnersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-center text-xs sm:text-sm lg:text-sm xl:text-base uppercase tracking-wider text-primary mb-3 sm:mb-4 lg:mb-4 font-semibold">
              {t('landing.trustedBy')}
            </p>
            
            <div
              onTouchStart={handlePartnersSwipeStart}
              onTouchMove={handlePartnersSwipeMove}
              onTouchEnd={handlePartnersSwipeEnd}
            >
              <Carousel 
                setApi={setPartnersApi}
                opts={{
                  align: "center",
                  loop: true,
                  watchDrag: true,
                  dragFree: false
                }} 
                plugins={[partnersAutoplayPlugin.current]} 
                className="w-full max-w-6xl mx-auto"
              >
                <CarouselContent className="-ml-0">
                  {/* NRG Totaal */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3 pl-0 basis-full">
                    <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]">
                      <img src={nrgTotaalLogo} alt="NRG Totaal" className="h-14 sm:h-16 w-auto transition-all" loading="lazy" width="120" height="48" decoding="async" />
                    </div>
                  </CarouselItem>
                  
                  {/* NutriBuddi */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3 pl-0 basis-full">
                    <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]" style={{ contain: 'layout style paint' }}>
                      <img src={nutribuddiLogo} alt="NutriBuddi" className="h-24 sm:h-28 w-auto transition-all" loading="lazy" width="140" height="112" decoding="async" />
                    </div>
                  </CarouselItem>
                  
                  {/* Onderhoudscontracten.com */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3 pl-0 basis-full">
                    <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]" style={{ contain: 'layout style paint' }}>
                      <img src={onderhoudscontractenLogo} alt="Onderhoudscontracten.com" className="h-20 sm:h-24 w-auto transition-all" loading="lazy" width="160" height="80" decoding="async" />
                    </div>
                  </CarouselItem>
                  
                  {/* ODÉA Vastgoed Service */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3 pl-0 basis-full">
                    <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]" style={{ contain: 'layout style paint' }}>
                      <img src={odeaVastgoedLogo} alt="ODÉA Vastgoed Service" className="h-20 sm:h-24 w-auto transition-all" loading="lazy" width="120" height="112" decoding="async" />
                    </div>
                  </CarouselItem>
                  
                  {/* Zorgeloos Vastgoed */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3 pl-0 basis-full">
                    <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]" style={{ contain: 'layout style paint' }}>
                      <img src={zorgeloosVastgoedLogo} alt="Zorgeloos Vastgoed" className="h-24 sm:h-28 w-auto transition-all" loading="lazy" width="120" height="48" />
                    </div>
                  </CarouselItem>
                  
                  {/* Fleature */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3 pl-0 basis-full">
                    <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px] max-h-[180px]" style={{ contain: 'layout style paint' }}>
                      <img src={fleatureLogo} alt="Fleature" className="h-28 sm:h-32 w-auto transition-all object-contain" loading="lazy" width="120" height="48" />
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="hidden lg:flex" />
                <CarouselNext className="hidden lg:flex" />
              </Carousel>
            </div>
            
            {/* Swipe dots indicator */}
            {!isMobile && (
              <div className="lg:hidden flex justify-center gap-2 mt-6">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <button
                    key={index}
                    onClick={() => partnersApi?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === partnersCurrentSlide
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/30'
                    }`}
                    aria-label={`Go to partner ${index + 1}`}
                  />
                ))}
              </div>
            )}
            {isMobile && (
              <div className="flex justify-center gap-2 mt-6">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <button
                    key={index}
                    onClick={() => partnersApi?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === partnersCurrentSlide
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/30'
                    }`}
                    aria-label={`Go to partner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <p className="text-xs sm:text-sm uppercase tracking-wider text-primary mb-4 font-semibold">
                {t('pricing.title').toUpperCase()}
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                {t('pricing.title')}
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('pricing.subtitle')}
              </p>

              {/* Billing Toggle */}
              <div className="flex flex-col items-center justify-center gap-2 lg:gap-4 mt-8">
                <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                  <Label htmlFor="billing-toggle-home" className={!isYearly ? 'font-bold text-xs sm:text-sm' : 'text-xs sm:text-sm'}>
                    {t('pricing.monthly')}
                  </Label>
                  <Switch id="billing-toggle-home" checked={isYearly} onCheckedChange={setIsYearly} />
                  <Label htmlFor="billing-toggle-home" className={isYearly ? 'font-bold text-xs sm:text-sm' : 'text-xs sm:text-sm'}>
                    {t('pricing.yearly')}
                  </Label>
                </div>
                <span className={`text-xs lg:text-sm text-primary font-semibold bg-primary/10 px-2 sm:px-3 lg:px-5 py-1 lg:py-2 rounded-full transition-opacity duration-200 ${isYearly ? 'opacity-100' : 'opacity-0'}`}>
                  {t('pricing.yearlyBonus')}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Free Plan */}
              <article className="group relative bg-gradient-to-b from-card via-card to-muted/20 rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1">{t('pricing.free.name')}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">€0</span>
                    <span className="text-xs text-muted-foreground">/{isYearly ? t('pricing.year') : t('pricing.month')}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

                {/* Features */}
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <span className="text-xs leading-relaxed">{t('pricing.free.feature1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <span className="text-xs leading-relaxed">{t('pricing.free.feature2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <span className="text-xs leading-relaxed">{t('pricing.free.feature3')}</span>
                  </li>
                </ul>

                {/* Corner Decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </article>

              {/* Pro Plan */}
              <article className="group relative bg-gradient-to-b from-primary/10 via-card to-accent/10 rounded-2xl p-6 border-2 border-primary shadow-xl scale-105 hover:scale-[1.03] hover:shadow-2xl transition-all duration-500 z-10">
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
                    {t('pricing.badges.bestValue')}
                  </span>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-2xl blur-xl opacity-50" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-1">{t('pricing.pro.name')}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        €{isYearly ? '79.90' : '7.99'}
                      </span>
                      <span className="text-xs text-muted-foreground">/{isYearly ? t('pricing.year') : t('pricing.month')}</span>
                    </div>
                    {isYearly && <div className="mt-1">
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                          {t('pricing.saveAmount').replace('{amount}', '16.00')}
                        </Badge>
                      </div>}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 mb-4" />

                  {/* Features */}
                  <ul className="space-y-2">
                    {[1, 2, 3].map(i => <li key={i} className="flex items-start gap-2">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                        <span className="text-xs leading-relaxed font-medium">{t(`pricing.pro.feature${i}`)}</span>
                      </li>)}
                  </ul>
                </div>

                {/* Corner Decoration */}
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-tr-full" />
              </article>

              {/* Team Plan */}
              <article className="group relative bg-gradient-to-b from-card via-card to-muted/20 rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1">{t('pricing.team.name')}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">€{isYearly ? '199.00' : '19.99'}</span>
                    <span className="text-xs text-muted-foreground">/{isYearly ? t('pricing.year') : t('pricing.month')}</span>
                  </div>
                  {isYearly && <div className="mt-1">
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                        {t('pricing.saveAmount').replace('{amount}', '40.88')}
                      </Badge>
                    </div>}
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

                {/* Features */}
                <ul className="space-y-2">
                  {[1, 2, 3].map(i => <li key={i} className="flex items-start gap-2">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <span className="text-xs leading-relaxed">{t(`pricing.team.feature${i}`)}</span>
                    </li>)}
                </ul>

                {/* Corner Decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </article>

              {/* Business Plan */}
              <article className="group relative bg-gradient-to-b from-card via-card to-muted/20 rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1">{t('pricing.business.name')}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">€{isYearly ? '390.00' : '39.00'}</span>
                    <span className="text-xs text-muted-foreground">/{isYearly ? t('pricing.year') : t('pricing.month')}</span>
                  </div>
                  {isYearly && <div className="mt-1">
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                        {t('pricing.saveAmount').replace('{amount}', '78.00')}
                      </Badge>
                    </div>}
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

                {/* Features */}
                <ul className="space-y-2">
                  {[1, 2, 3].map(i => <li key={i} className="flex items-start gap-2">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <span className="text-xs leading-relaxed">{t(`pricing.business.feature${i}`)}</span>
                    </li>)}
                </ul>

                {/* Corner Decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </article>
            </div>

            <div className="mt-6 sm:mt-8 lg:mt-8 text-center">
              <p className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg text-muted-foreground">
                {t('pricing.footer')}
              </p>
            </div>

            {/* Register Button - responsive */}
            <div className="mt-6 sm:mt-8 lg:mt-8 text-center">
              <Link to="/auth?mode=create">
                <Button size="lg" className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg px-6 sm:px-8 lg:px-8 py-5 sm:py-6 lg:py-5 shadow-lg hover:shadow-xl transition-all">
                  {t('landing.register')}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* SoloLinq CTA Section - responsive */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          
        </section>

        {/* Footer - responsive */}
        <footer className="py-4 sm:py-5 lg:py-5 mt-4 sm:mt-6 lg:mt-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center text-xs sm:text-sm md:text-base lg:text-sm text-muted-foreground max-w-[1920px]">
            <p>{t('landing.footerText')}</p>
          </div>
        </footer>
      </div>
    </>;
};
export default Index;