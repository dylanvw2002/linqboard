import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn, Eye, Edit, Bell, Paperclip, Layout, Calendar, Clipboard, FileText, Target, Clock, CheckSquare, Archive, CheckCircle2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import logo from "@/assets/logo-transparent.png";
import linqboardMascot from "@/assets/linqboard-mascot-new.png";
import collaborationIllustration from "@/assets/collaboration-illustration.png";
import linqboardMascotTry from "@/assets/linqboard-mascot-try.png";
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
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
const Index = () => {
  const {
    t
  } = useTranslation();
  const demoSection = useScrollAnimation(0.2);
  const featuresSection = useScrollAnimation(0.2);
  const partnersSection = useScrollAnimation(0.2);
  const autoplayPlugin = useRef(Autoplay({
    delay: 3000,
    stopOnInteraction: false
  }));
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
        {/* Background Icons Pattern - Carefully spaced to prevent any overlap */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Desktop icons - hidden on mobile */}
          <div className="hidden md:block">
            <Calendar className="absolute top-[5%] left-[5%] w-10 h-10 text-primary opacity-5" />
            <Clipboard className="absolute top-[5%] left-[30%] w-10 h-10 text-primary opacity-5" />
            <FileText className="absolute top-[5%] left-[55%] w-10 h-10 text-primary opacity-5" />
            <Target className="absolute top-[5%] left-[80%] w-10 h-10 text-primary opacity-5" />
            
            <Clock className="absolute top-[20%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <CheckSquare className="absolute top-[20%] left-[35%] w-10 h-10 text-primary opacity-5" />
            <Archive className="absolute top-[20%] left-[60%] w-10 h-10 text-primary opacity-5" />
            <CheckCircle2 className="absolute top-[20%] left-[85%] w-10 h-10 text-primary opacity-5" />
            
            <Zap className="absolute top-[35%] left-[5%] w-10 h-10 text-primary opacity-5" />
            <Paperclip className="absolute top-[35%] left-[30%] w-10 h-10 text-primary opacity-5" />
            <Layout className="absolute top-[35%] left-[55%] w-10 h-10 text-primary opacity-5" />
            <Calendar className="absolute top-[35%] left-[80%] w-10 h-10 text-primary opacity-5" />
            
            <Clipboard className="absolute top-[50%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <FileText className="absolute top-[50%] left-[35%] w-10 h-10 text-primary opacity-5" />
            <Target className="absolute top-[50%] left-[60%] w-10 h-10 text-primary opacity-5" />
            <Clock className="absolute top-[50%] left-[85%] w-10 h-10 text-primary opacity-5" />
            
            <CheckSquare className="absolute top-[65%] left-[5%] w-10 h-10 text-primary opacity-5" />
            <Archive className="absolute top-[65%] left-[30%] w-10 h-10 text-primary opacity-5" />
            <CheckCircle2 className="absolute top-[65%] left-[55%] w-10 h-10 text-primary opacity-5" />
            <Zap className="absolute top-[65%] left-[80%] w-10 h-10 text-primary opacity-5" />
            
            <Paperclip className="absolute top-[80%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <Layout className="absolute top-[80%] left-[35%] w-10 h-10 text-primary opacity-5" />
            <Calendar className="absolute top-[80%] left-[60%] w-10 h-10 text-primary opacity-5" />
            <Clipboard className="absolute top-[80%] left-[85%] w-10 h-10 text-primary opacity-5" />
          </div>
          
          {/* Mobile icons - fewer and strategically placed */}
          <div className="block md:hidden">
            <Calendar className="absolute top-[10%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <CheckSquare className="absolute top-[10%] right-[10%] w-10 h-10 text-primary opacity-5" />
            
            <Target className="absolute top-[30%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <Clock className="absolute top-[30%] right-[10%] w-10 h-10 text-primary opacity-5" />
            
            <Zap className="absolute top-[50%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <FileText className="absolute top-[50%] right-[10%] w-10 h-10 text-primary opacity-5" />
            
            <CheckCircle2 className="absolute top-[70%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <Clipboard className="absolute top-[70%] right-[10%] w-10 h-10 text-primary opacity-5" />
            
            <Archive className="absolute top-[90%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <Paperclip className="absolute top-[90%] right-[10%] w-10 h-10 text-primary opacity-5" />
          </div>
        </div>
        
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50" role="banner">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <nav className="flex items-center justify-between h-16 sm:h-20 lg:h-24" role="navigation" aria-label="Main navigation">
              <div className="flex items-center gap-8">
                <img src={logo} alt="LinqBoard - Visueel Projectmanagement Platform" className="h-40 sm:h-44 lg:h-40 w-auto hover:scale-105 transition-transform duration-300" fetchPriority="high" width="160" height="160" />
              </div>
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                <LanguageSwitcher />
                <Link to="/auth">
                  <Button size="lg" className="bg-white hover:bg-gray-50 text-foreground border border-gray-200 shadow-sm hover:shadow transition-all text-base sm:text-lg gap-2 sm:gap-3 h-12 px-6">
                    <LogIn className="h-5 w-5" />
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
                Teamwerk, <span className="text-primary">moeiteloos georganiseerd</span>
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

        {/* Features Section */}
        <section ref={featuresSection.ref} className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 mt-0 lg:py-[200px]">
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

        {/* Testimonial Quotes Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-xs sm:text-sm uppercase tracking-wider text-primary mb-4 font-semibold">
              TESTIMONIALS
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Wat onze gebruikers <span className="text-primary">over ons</span> zeggen
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Ontdek waarom teams voor LinqBoard kiezen
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Quote 1 - NRG Totaal */}
            <div className="relative h-full">
              <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-xl sm:rounded-2xl p-6 sm:p-7 border border-border shadow-lg h-full flex flex-col">
                {/* Quote Content */}
                <div className="space-y-4 flex-1 flex flex-col">
                  <blockquote className="text-sm sm:text-base lg:text-lg font-medium text-foreground leading-relaxed italic flex-1">
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
            <div className="relative h-full">
              <div className="bg-gradient-to-br from-card via-card to-accent/5 rounded-xl sm:rounded-2xl p-6 sm:p-7 border border-border shadow-lg h-full flex flex-col">
                {/* Quote Content */}
                <div className="space-y-4 flex-1 flex flex-col">
                  <blockquote className="text-sm sm:text-base lg:text-lg font-medium text-foreground leading-relaxed italic flex-1">
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
        <section ref={demoSection.ref} className="py-8 sm:py-12 lg:py-20 xl:py-28 px-4 sm:px-6 lg:px-12 xl:px-20 min-h-screen flex items-center w-full">
          <div className="w-full max-w-none">
            <div className={`grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 xl:gap-24 items-center transition-all duration-700 ease-out ${demoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  {/* Left: Image */}
                  <div className={`transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 -translate-x-0' : 'opacity-0 translate-x-8'}`}>
                    <img alt="Linqboard Demo Preview" className="w-2/5 h-auto mx-auto" loading="lazy" width="600" height="400" src={linqboardMascotChair} />
                  </div>

                  {/* Right: Content */}
                  <div className={`space-y-6 sm:space-y-8 lg:space-y-10 transition-all duration-700 ease-out delay-100 ${demoSection.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                      {t('landing.demoTitle')}
                    </h2>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl text-muted-foreground leading-relaxed">
                      {t('landing.demoSubtitle')}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 xl:gap-8">
                      <div className="flex items-center gap-4 lg:gap-5 xl:gap-6">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-primary" />
                        </div>
                        <span className="text-base sm:text-lg lg:text-xl xl:text-2xl font-medium">{t('landing.demoFeature1')}</span>
                      </div>
                      <div className="flex items-center gap-4 lg:gap-5 xl:gap-6">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Edit className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-primary" />
                        </div>
                        <span className="text-base sm:text-lg lg:text-xl xl:text-2xl font-medium">{t('landing.demoFeature2')}</span>
                      </div>
                      <div className="flex items-center gap-4 lg:gap-5 xl:gap-6">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Eye className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-primary" />
                        </div>
                        <span className="text-base sm:text-lg lg:text-xl xl:text-2xl font-medium">{t('landing.demoFeature3')}</span>
                      </div>
                    </div>

                    <Link to="/board/demo" className="block pt-3 lg:pt-4 xl:pt-6">
                      <Button size="lg" className="text-lg sm:text-xl lg:text-xl xl:text-2xl px-10 py-6 lg:py-7 xl:py-8 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                        {t('landing.demoButton')}
                        <ArrowRight className="ml-2 w-6 h-6 lg:w-7 lg:h-7" />
                      </Button>
                    </Link>
                </div>
              </div>
            </div>
          </section>

        {/* Partners Section */}
        <section ref={partnersSection.ref} className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-7xl">
          <div className={`bg-muted/20 rounded-xl sm:rounded-2xl lg:rounded-2xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 transition-all duration-700 ease-out ${partnersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-center text-xs sm:text-sm uppercase tracking-wider text-primary mb-4 font-semibold">
              {t('landing.trustedBy')}
            </p>
            
            <Carousel opts={{
            align: "start",
            loop: true
          }} plugins={[autoplayPlugin.current]} className="w-full max-w-6xl mx-auto">
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

        {/* Pricing Section */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <p className="text-xs sm:text-sm uppercase tracking-wider text-primary mb-4 font-semibold">
                PRIJZEN
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Kies jouw <span className="text-primary">plan</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Groei met ons mee - van starter tot enterprise
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Free Plan */}
              <article className="group relative bg-gradient-to-b from-card via-card to-muted/20 rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1">{t('pricing.free.name')}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">€0</span>
                    <span className="text-xs text-muted-foreground">/{t('pricing.month')}</span>
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
                      <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">€7.99</span>
                      <span className="text-xs text-muted-foreground">/{t('pricing.month')}</span>
                    </div>
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
                    <span className="text-3xl font-bold">€19.99</span>
                    <span className="text-xs text-muted-foreground">/{t('pricing.month')}</span>
                  </div>
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
                    <span className="text-3xl font-bold">€39.00</span>
                    <span className="text-xs text-muted-foreground">/{t('pricing.month')}</span>
                  </div>
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

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('pricing.footer')}
              </p>
            </div>

            {/* Register Button */}
            <div className="mt-8 text-center">
              <Link to="/auth?mode=create">
                <Button size="lg" className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                  Registreren
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
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