import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn, Eye, Edit, Bell, Paperclip, Layout, Calendar, Clipboard, FileText, Target, Clock, CheckSquare, Archive, CheckCircle2, Check } from "lucide-react";
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
import fleatureLogo from "@/assets/partners/fleature.png";
import sololinqLogo from "@/assets/partners/sololinq.png";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
const Index = () => {
  const {
    t
  } = useTranslation();
  const demoSection = useScrollAnimation(0.2);
  const featuresSection = useScrollAnimation(0.2);
  const partnersSection = useScrollAnimation(0.2);
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  );
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

        {/* Testimonial Quotes Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Quote 1 - NRG Totaal */}
            <div className="relative">
              <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-xl sm:rounded-2xl p-6 sm:p-7 border border-border shadow-lg">
                {/* Quote Content */}
                <div className="space-y-4">
                  <blockquote className="text-sm sm:text-base lg:text-lg font-medium text-foreground leading-relaxed italic">
                    <span className="text-purple-500 text-5xl font-serif mr-2">"</span>LinqBoard is voor ons de perfecte vervanging van het traditionele whiteboard. Eindelijk kunnen we alle projecten digitaal en overzichtelijk beheren, zonder dat we nog met markers hoeven te werken!
                  </blockquote>
                  
                  {/* Attribution */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <img src={nrgTotaalLogo} alt="NRG Totaal logo" className="h-8 w-auto opacity-80" loading="lazy" />
                    <div>
                      <p className="font-semibold text-sm text-foreground">NRG Totaal</p>
                      <p className="text-xs text-muted-foreground">Technische Installaties</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote 2 - Zorgeloos Vastgoed */}
            <div className="relative">
              <div className="bg-gradient-to-br from-card via-card to-accent/5 rounded-xl sm:rounded-2xl p-6 sm:p-7 border border-border shadow-lg">
                {/* Quote Content */}
                <div className="space-y-4">
                  <blockquote className="text-sm sm:text-base lg:text-lg font-medium text-foreground leading-relaxed italic">
                    <span className="text-purple-500 text-5xl font-serif mr-2">"</span>Met de slimme reminder-functie en deadline tracking van LinqBoard vergeten we nooit meer een belangrijke taak. Alle vastgoedprojecten lopen nu soepel en op tijd!
                  </blockquote>
                  
                  {/* Attribution */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <img src={zorgeloosVastgoedLogo} alt="Zorgeloos Vastgoed BV logo" className="h-8 w-auto opacity-80" loading="lazy" />
                    <div>
                      <p className="font-semibold text-sm text-foreground">Zorgeloos Vastgoed BV</p>
                      <p className="text-xs text-muted-foreground">Vastgoed digitalisering</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
        <section ref={featuresSection.ref} className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-700 ease-out ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-xs sm:text-sm uppercase tracking-wider text-primary mb-4 font-semibold">
                FEATURES
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Alles wat je nodig hebt
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Krachtige functies om je team productiever te maken
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => {
              const Icon = feature.icon;
              return <article key={index} className={`group relative bg-card rounded-2xl p-8 border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{
                animationDelay: `${index * 100}ms`
              }}>
                    {/* Gradient Background on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="mb-6 relative">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500">
                          <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                        </div>
                        {/* Glow Effect */}
                        <div className="absolute inset-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                      </div>

                      {/* Text */}
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </article>;
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
            
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[autoplayPlugin.current]}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent>
                {/* NRG Totaal */}
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]">
                    <img src={nrgTotaalLogo} alt="NRG Totaal" className="h-14 sm:h-16 w-auto transition-all" loading="lazy" width="120" height="48" />
                  </div>
                </CarouselItem>
                
                {/* NutriBuddi */}
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]">
                    <img src={nutribuddiLogo} alt="NutriBuddi" className="h-24 sm:h-28 w-auto transition-all" loading="lazy" width="140" height="112" />
                  </div>
                </CarouselItem>
                
                {/* Onderhoudscontracten.com */}
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]">
                    <img src={onderhoudscontractenLogo} alt="Onderhoudscontracten.com" className="h-20 sm:h-24 w-auto transition-all" loading="lazy" width="160" height="80" />
                  </div>
                </CarouselItem>
                
                {/* ODÉA Vastgoed Service */}
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]">
                    <img src={odeaVastgoedLogo} alt="ODÉA Vastgoed Service" className="h-20 sm:h-24 w-auto transition-all" loading="lazy" width="120" height="112" />
                  </div>
                </CarouselItem>
                
                {/* Zorgeloos Vastgoed */}
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px]">
                    <img src={zorgeloosVastgoedLogo} alt="Zorgeloos Vastgoed" className="h-24 sm:h-28 w-auto transition-all" loading="lazy" width="120" height="48" />
                  </div>
                </CarouselItem>
                
                {/* Fleature */}
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <div className="flex items-center justify-center p-6 sm:p-8 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 min-h-[180px] max-h-[180px]">
                    <img src={fleatureLogo} alt="Fleature" className="h-28 sm:h-32 w-auto transition-all object-contain" loading="lazy" width="120" height="48" />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>

        {/* SoloLinq CTA Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="mt-8 md:mt-12 bg-primary/5 backdrop-blur-sm rounded-2xl border border-primary/20 hover:border-primary/40 transition-all duration-300 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <img src={sololinqLogo} alt="SoloLinq Logo" className="h-20 sm:h-24 w-auto" loading="lazy" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  Werk je solo? Ontdek SoloLinq!
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Persoonlijke to-do manager voor wie alleen werkt. Simpel, snel en overzichtelijk.
                </p>
              </div>
              <div className="flex-shrink-0">
                <a href="https://sololinq.lovable.app" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="text-base px-6 py-6 border-2">
                    Bekijk SoloLinq
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('pricing.title')}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                {t('pricing.subtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Free Plan */}
              <Card className="relative border-border/50 hover:[transform:perspective(1000px)_rotateX(2deg)] transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{t('pricing.free.name')}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">€0</span>
                    <span className="text-sm text-muted-foreground">/{t('pricing.month')}</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs">{t('pricing.free.feature1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs">{t('pricing.free.feature2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs">{t('pricing.free.feature3')}</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" size="sm">
                    {t('landing.getStarted')}
                  </Button>
                </CardFooter>
              </Card>

              {/* Pro Plan */}
              <Card className="relative border-2 border-primary shadow-xl scale-105 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 hover:scale-[1.07] hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary/90">
                  {t('pricing.badges.bestValue')}
                </Badge>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{t('pricing.pro.name')}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">€7.99</span>
                    <span className="text-sm text-muted-foreground">/{t('pricing.month')}</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <ul className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs">{t(`pricing.pro.feature${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" size="sm">
                    {t('pricing.upgrade')}
                  </Button>
                </CardFooter>
              </Card>

              {/* Team Plan */}
              <Card className="relative border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-purple-500/10 to-blue-500/5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white hover:bg-blue-600">
                  {t('pricing.badges.forTeams')}
                </Badge>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{t('pricing.team.name')}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">€19.99</span>
                    <span className="text-sm text-muted-foreground">/{t('pricing.month')}</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <ul className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs">{t(`pricing.team.feature${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" size="sm">
                    {t('pricing.upgrade')}
                  </Button>
                </CardFooter>
              </Card>

              {/* Business Plan */}
              <Card className="relative border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-yellow-600/10 to-yellow-500/5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white hover:bg-yellow-600">
                  {t('pricing.badges.enterprise')}
                </Badge>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{t('pricing.business.name')}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">€39.00</span>
                    <span className="text-sm text-muted-foreground">/{t('pricing.month')}</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <ul className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs">{t(`pricing.business.feature${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" size="sm">
                    {t('pricing.upgrade')}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('pricing.footer')}
              </p>
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