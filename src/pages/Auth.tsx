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
import authIllustration from "@/assets/auth-illustration.png";
import logo from "@/assets/logo-transparent.png";

const Auth = () => {
  const { t } = useTranslation();
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
        const { data, error } = await supabase.functions.invoke('request-password-reset', {
          body: { email }
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
        <img src={logo} alt="LinqBoard" className="h-[100px] sm:h-[150px] lg:h-[180px] w-auto opacity-80" />
      </div>

      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-10">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md lg:max-w-lg mx-4 sm:mx-0 shadow-xl lg:shadow-2xl bg-card/95 backdrop-blur border-2 border-primary/20 relative z-10">
        <div className="flex justify-center pt-6 sm:pt-8 lg:pt-10 pb-3 sm:pb-4 lg:pb-5">
          <img src={authIllustration} alt="LinqBoard Authentication" className="h-40 sm:h-56 lg:h-60 w-auto" />
        </div>
        <CardHeader className="space-y-2 lg:space-y-3 pt-2 px-4 sm:px-6 lg:px-8">
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center">
            {isForgotPassword ? t('auth.resetPassword') : isLogin ? t('auth.welcome') : t('auth.createAccount')}
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base lg:text-lg">
            {isForgotPassword ? t('auth.resetPasswordDescription') : isLogin ? t('auth.loginDescription') : t('auth.signupDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 lg:px-8 pb-8 lg:pb-10">
          <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4 lg:space-y-5">
            {!isLogin && !isForgotPassword && <div className="space-y-2">
                <Label htmlFor="fullName" className="lg:text-base">{t('auth.fullName')}</Label>
                <Input id="fullName" type="text" placeholder={t('auth.namePlaceholder')} value={fullName} onChange={e => setFullName(e.target.value)} required disabled={loading} className="lg:h-11 lg:text-base" />
              </div>}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="lg:text-base">{t('auth.email')}</Label>
              <Input id="email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} className="lg:h-11 lg:text-base" />
            </div>
            
            {!isForgotPassword && <div className="space-y-2">
                <Label htmlFor="password" className="lg:text-base">{t('auth.password')}</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    minLength={6} 
                    disabled={loading}
                    className="pr-10 lg:h-11 lg:text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent lg:h-11"
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
                {!isLogin && <p className="text-xs lg:text-sm text-muted-foreground">
                    {t('auth.minPasswordLength')}
                  </p>}
              </div>}
            
            <Button type="submit" className="w-full lg:h-11 lg:text-base font-semibold" disabled={loading}>
              {loading ? <>
                  <Loader2 className="mr-2 h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                  {t('auth.busy')}
                </> : isForgotPassword ? t('auth.sendResetLink') : isLogin ? t('auth.login') : t('auth.signup')}
            </Button>
          </form>
          
          <div className="mt-6 lg:mt-7 text-center space-y-2 lg:space-y-3">
            {!isForgotPassword && <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm lg:text-base text-primary hover:underline block w-full" disabled={loading}>
                {isLogin ? t('auth.noAccount') : t('auth.alreadyAccount')}
              </button>}
            
            {isLogin && !isForgotPassword && <button type="button" onClick={() => {
            setIsForgotPassword(true);
            setPassword("");
          }} className="text-sm lg:text-base text-muted-foreground hover:text-primary hover:underline block w-full" disabled={loading}>
                {t('auth.forgotPassword')}
              </button>}
            
            {isForgotPassword && <button type="button" onClick={() => {
            setIsForgotPassword(false);
            setEmail("");
          }} className="text-sm lg:text-base text-primary hover:underline block w-full" disabled={loading}>
                {t('auth.backToLogin')}
              </button>}
          </div>
        </CardContent>
      </Card>

    </div>;
};
export default Auth;