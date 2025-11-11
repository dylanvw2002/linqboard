import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import authIllustration from "@/assets/auth-illustration.png";
import logo from "@/assets/logo-transparent.png";

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Memorize confetti dots so they don't regenerate on every render
  const confettiDots = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      color: ['#8B5CF6', '#3B82F6'][Math.floor(Math.random() * 2)]
    }));
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is logged in but needs to reset password
        console.log("User session detected for password reset");
      }
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error(t('resetPassword.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('auth.minPasswordLength'));
      return;
    }

    if (!resetToken) {
      toast.error('Geen geldige reset code gevonden');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('reset-password-with-token', {
        body: { token: resetToken, newPassword }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || t('resetPassword.success'));
      
      // Redirect to login after successful password reset
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || t('resetPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4 lg:p-6 relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiDots.map((dot) => (
          <div
            key={dot.id}
            className="absolute animate-float"
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              animationDelay: `${dot.delay}s`,
              animationDuration: `${dot.duration}s`
            }}
          >
            <div 
              className="w-2 h-2 lg:w-3 lg:h-3 rounded-full"
              style={{
                backgroundColor: dot.color,
                opacity: 0.4
              }}
            />
          </div>
        ))}
      </div>

      {/* Logo linksonder */}
      <div className="absolute -bottom-8 left-2 sm:left-6 lg:left-10 z-10">
        <img src={logo} alt="LinqBoard" className="h-[100px] sm:h-[150px] lg:h-[180px] w-auto opacity-80" />
      </div>

      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-10">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md lg:max-w-lg mx-4 sm:mx-0 shadow-xl lg:shadow-2xl bg-card/95 backdrop-blur border-2 border-primary/20 relative z-10">
        <div className="flex justify-center pt-6 sm:pt-8 lg:pt-10 pb-3 sm:pb-4 lg:pb-5">
          <img src={authIllustration} alt="LinqBoard Reset Password" className="h-40 sm:h-56 lg:h-64 w-auto" />
        </div>
        <CardHeader className="space-y-2 lg:space-y-3 pt-2 px-4 sm:px-6 lg:px-8">
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center">
            {t('resetPassword.title')}
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base lg:text-lg">
            {t('resetPassword.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4 lg:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="lg:text-base">{t('resetPassword.newPassword')}</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  disabled={loading}
                  className="pr-10 lg:h-12 lg:text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent lg:h-12"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="lg:text-base">{t('resetPassword.confirmPassword')}</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  disabled={loading}
                  className="pr-10 lg:h-12 lg:text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent lg:h-12"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs lg:text-sm text-muted-foreground">
                {t('auth.minPasswordLength')}
              </p>
            </div>
            
            <Button type="submit" className="w-full lg:h-12 lg:text-lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                  {t('auth.busy')}
                </>
              ) : (
                t('resetPassword.submit')
              )}
            </Button>
          </form>
          
          <div className="mt-6 lg:mt-8 text-center">
            <button 
              type="button" 
              onClick={() => navigate("/auth")} 
              className="text-sm lg:text-base text-primary hover:underline"
              disabled={loading}
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
