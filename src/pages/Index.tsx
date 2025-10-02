import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, LogIn, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-transparent.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
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
      <div className="container mx-auto px-6 py-12 md:py-20">
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
            <div className="bg-card/80 backdrop-blur-sm border-4 border-primary/20 rounded-3xl p-8 shadow-2xl">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-4">To-Do Board</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full"></div>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: "Planning opvullen deze week", status: "done" },
                  { label: "WDA gesprekspunten", status: "progress" },
                  { label: "Werkbonnen aanmaken", status: "todo" }
                ].map((task, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-border/50">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      task.status === "done" ? "bg-primary" : "bg-muted"
                    }`}>
                      {task.status === "done" && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className={`h-3 rounded-full ${
                        task.status === "done" 
                          ? "bg-gradient-to-r from-primary/60 to-primary/30 w-full" 
                          : task.status === "progress"
                          ? "bg-gradient-to-r from-accent/60 to-accent/20 w-3/4"
                          : "bg-muted w-1/2"
                      }`}></div>
                    </div>
                    {task.status === "progress" && (
                      <span className="px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full">
                        In uitvoering
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-tr from-accent to-primary rounded-full opacity-20 blur-2xl"></div>
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
