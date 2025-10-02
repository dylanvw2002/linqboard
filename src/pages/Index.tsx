import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header with Login Button */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-end">
          <Link to="/auth">
            <Button variant="outline" size="lg" className="border-2">
              <LogIn className="mr-2 h-5 w-5" />
              Inloggen
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              Samenwerken zoals het hoort
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            Teamwerk, moeiteloos georganiseerd
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Beheer taken, werk realtime samen en houd je team op één lijn met onze moderne taakmanagement tool
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth?mode=create">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                Maak een organisatie
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link to="/auth?mode=join">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                Ik heb een code
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-24">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-md hover:shadow-lg transition-all animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Realtime samenwerking</h3>
            <p className="text-muted-foreground">
              Werk samen zoals in Google Sheets. Zie direct wie online is en wat er verandert.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-md hover:shadow-lg transition-all animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Team management</h3>
            <p className="text-muted-foreground">
              Nodig teamleden uit met een simpele code. Iedereen krijgt direct toegang.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-md hover:shadow-lg transition-all animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Veilig & privé</h3>
            <p className="text-muted-foreground">
              Jouw data is beveiligd. Alleen teamleden hebben toegang tot jullie boards.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 LinqBoard. Samenwerken zonder gedoe.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
