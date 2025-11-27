import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Shield, Users, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import authIllustration from "@/assets/linqboard-auth-mascot.png";
import logo from "@/assets/logo-transparent.png";
const Auth = () => {
  const {
    t
  } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode") || "login";
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
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
        const {
          data,
          error
        } = await supabase.functions.invoke('request-password-reset', {
          body: {
            email
          }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success(data?.message || t('auth.checkEmailReset'));
        setIsForgotPassword(false);
        setEmail("");
      } else if (isLogin) {
        const {
          data,
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          // Check for unconfirmed email error
          if (error.message.toLowerCase().includes('email') && error.message.toLowerCase().includes('confirm')) {
            toast.error(t('auth.emailNotConfirmed'));
            setLoading(false);
            return;
          }
          throw error;
        }
        if (data.user) {
          toast.success(t('auth.loginSuccess'));
          navigate("/dashboard");
        }
      } else {
        if (!fullName.trim()) {
          toast.error(t('auth.enterFullName'));
          setLoading(false);
          return;
        }
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            },
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;

        // Send welcome email
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email,
              userName: fullName
            }
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't block signup if email fails
        }

        // Show success message and switch back to login
        toast.success(t('auth.accountCreatedConfirmEmail'));
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setFullName("");
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4 lg:p-6 relative overflow-hidden">
      {/* Background pattern with icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="hidden md:block">
          <Eye className="absolute top-[10%] left-[8%] w-10 h-10 text-primary opacity-5" />
          <Shield className="absolute top-[10%] right-[8%] w-10 h-10 text-primary opacity-5" />
          
          <Users className="absolute top-[30%] left-[12%] w-10 h-10 text-primary opacity-5" />
          <Zap className="absolute top-[30%] right-[12%] w-10 h-10 text-primary opacity-5" />
          
          <Eye className="absolute bottom-[30%] left-[8%] w-10 h-10 text-primary opacity-5" />
          <Shield className="absolute bottom-[30%] right-[8%] w-10 h-10 text-primary opacity-5" />
          
          <Users className="absolute bottom-[10%] left-[12%] w-10 h-10 text-primary opacity-5" />
          <Zap className="absolute bottom-[10%] right-[12%] w-10 h-10 text-primary opacity-5" />
        </div>
        
        <div className="block md:hidden">
          <Eye className="absolute top-[15%] left-[5%] w-10 h-10 text-primary opacity-5" />
          <Shield className="absolute top-[15%] right-[5%] w-10 h-10 text-primary opacity-5" />
          
          <Users className="absolute bottom-[15%] left-[5%] w-10 h-10 text-primary opacity-5" />
          <Zap className="absolute bottom-[15%] right-[5%] w-10 h-10 text-primary opacity-5" />
        </div>
      </div>

      {/* Logo linksonder */}
      <div className="absolute -bottom-8 left-2 sm:left-6 lg:left-10 z-10">
        
      </div>

      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-10">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-sm mx-4 sm:mx-0 shadow-lg bg-card/95 backdrop-blur border-2 border-primary/20 relative z-10">
        <div className="flex justify-center pt-4 pb-2">
          <img src={authIllustration} alt="LinqBoard Authentication" className="h-32 sm:h-40 w-auto" />
        </div>
        <CardHeader className="space-y-1 pt-1 px-4 sm:px-5">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            {isForgotPassword ? t('auth.resetPassword') : isLogin ? t('auth.welcome') : t('auth.createAccount')}
          </CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm">
            {isForgotPassword ? t('auth.resetPasswordDescription') : isLogin ? t('auth.loginDescription') : t('auth.signupDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pb-6">
          <form onSubmit={handleAuth} className="space-y-3">
            {!isLogin && !isForgotPassword && <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm">{t('auth.fullName')}</Label>
                <Input id="fullName" type="text" placeholder={t('auth.namePlaceholder')} value={fullName} onChange={e => setFullName(e.target.value)} required disabled={loading} className="h-9 text-sm" />
              </div>}
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">{t('auth.email')}</Label>
              <Input id="email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} className="h-9 text-sm" />
            </div>
            
            {!isForgotPassword && <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">{t('auth.password')}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={loading} className="pr-10 h-9 text-sm" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-2 py-1 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {!isLogin && <p className="text-xs text-muted-foreground">
                    {t('auth.minPasswordLength')}
                  </p>}
              </div>}
            
            <Button type="submit" className="w-full h-9 text-sm font-semibold" disabled={loading}>
              {loading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.busy')}
                </> : isForgotPassword ? t('auth.sendResetLink') : isLogin ? t('auth.login') : t('auth.signup')}
            </Button>
          </form>
          
          <div className="mt-4 text-center space-y-1.5">
            {!isForgotPassword && <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-xs sm:text-sm text-primary hover:underline block w-full" disabled={loading}>
                {isLogin ? t('auth.noAccount') : t('auth.alreadyAccount')}
              </button>}
            
            {isLogin && !isForgotPassword && <button type="button" onClick={() => {
            setIsForgotPassword(true);
            setPassword("");
          }} className="text-xs sm:text-sm text-muted-foreground hover:text-primary hover:underline block w-full" disabled={loading}>
                {t('auth.forgotPassword')}
              </button>}
            
            {isForgotPassword && <button type="button" onClick={() => {
            setIsForgotPassword(false);
            setEmail("");
          }} className="text-xs sm:text-sm text-primary hover:underline block w-full" disabled={loading}>
                {t('auth.backToLogin')}
              </button>}
          </div>
        </CardContent>
      </Card>

    </div>;
};
export default Auth;