import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-transparent.png";
import todoBoardIllustration from "@/assets/todo-board-illustration.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="container mx-auto px-6 py-1">
        <div className="flex items-center justify-between">
          <img src={logo} alt="LinqBoard Logo" className="h-48 w-auto" />
          <Link to="/auth">
            <Button variant="outline" size="lg" className="border-2">
              <LogIn className="mr-2 h-5 w-5" />
              Inloggen
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-2 md:py-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Teamwerk, moeiteloos georganiseerd
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-xl">
              Beheer taken, werk realtime samen en houd je team op één lijn met onze moderne taakmanagement tool
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth?mode=create">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                  Aan de slag
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link to="/auth?mode=join">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 w-full sm:w-auto">
                  Ik heb een code
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual Mockup */}
          <div className="relative">
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
      <div className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Realtime samenwerking</h3>
            <p className="text-muted-foreground">
              Werk samen zoals in Google Sheets. Zie direct wie online is en wat er verandert.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Team management</h3>
            <p className="text-muted-foreground">
              Nodig teamleden uit met een simpele code. Iedereen krijgt direct toegang.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Veilig & privé</h3>
            <p className="text-muted-foreground">
              Jouw data is beveiligd. Alleen teamleden hebben toegang tot jullie boards.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© 2025 LinqBoard. Samenwerken zonder gedoe.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
