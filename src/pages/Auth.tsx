import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo-transparent.png";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode") || "login";
  
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });

        if (error) throw error;

        toast.success("Controleer je email voor de reset link!");
        setIsForgotPassword(false);
        setEmail("");
      } else if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast.success("Succesvol ingelogd!");
          navigate("/dashboard");
        }
      } else {
        if (!fullName.trim()) {
          toast.error("Vul je volledige naam in");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        if (data.user) {
          toast.success("Account aangemaakt!");
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="flex justify-center pt-8 pb-4">
          <img src={logo} alt="LinqBoard Logo" className="h-32" />
        </div>
        <CardHeader className="space-y-2 pt-2">
          <CardTitle className="text-3xl font-bold text-center">
            {isForgotPassword 
              ? "Wachtwoord resetten" 
              : isLogin 
              ? "Welkom terug" 
              : "Account aanmaken"}
          </CardTitle>
          <CardDescription className="text-center">
            {isForgotPassword
              ? "Voer je email in om een reset link te ontvangen"
              : isLogin
              ? "Log in om toegang te krijgen tot je boards"
              : "Maak een account aan om te starten"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Volledige naam</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jan Jansen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="jij@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">
                    Minimaal 6 karakters
                  </p>
                )}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig...
                </>
              ) : isForgotPassword ? (
                "Verstuur reset link"
              ) : isLogin ? (
                "Inloggen"
              ) : (
                "Account aanmaken"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            {!isForgotPassword && (
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline block w-full"
                disabled={loading}
              >
                {isLogin
                  ? "Nog geen account? Registreer hier"
                  : "Al een account? Log in"}
              </button>
            )}
            
            {isLogin && !isForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setPassword("");
                }}
                className="text-sm text-muted-foreground hover:text-primary hover:underline block w-full"
                disabled={loading}
              >
                Wachtwoord vergeten?
              </button>
            )}
            
            {isForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setEmail("");
                }}
                className="text-sm text-primary hover:underline block w-full"
                disabled={loading}
              >
                Terug naar inloggen
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
