import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
          error
        } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`
        });
        if (error) throw error;
        toast.success(t('auth.checkEmailReset'));
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
        if (error) throw error;
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
          data,
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
        if (data.user) {
          toast.success(t('auth.accountCreated'));
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <div className="flex justify-center pt-8 pb-4">
          <img src={logo} alt="LinqBoard Logo" className="h-56" />
        </div>
        <CardHeader className="space-y-2 pt-2">
          <CardTitle className="text-3xl font-bold text-center">
            {isForgotPassword ? t('auth.resetPassword') : isLogin ? t('auth.welcome') : t('auth.createAccount')}
          </CardTitle>
          <CardDescription className="text-center">
            {isForgotPassword ? t('auth.resetPasswordDescription') : isLogin ? t('auth.loginDescription') : t('auth.signupDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && !isForgotPassword && <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <Input id="fullName" type="text" placeholder={t('auth.namePlaceholder')} value={fullName} onChange={e => setFullName(e.target.value)} required disabled={loading} />
              </div>}
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>
            
            {!isForgotPassword && <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={loading} />
                {!isLogin && <p className="text-xs text-muted-foreground">
                    {t('auth.minPasswordLength')}
                  </p>}
              </div>}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.busy')}
                </> : isForgotPassword ? t('auth.sendResetLink') : isLogin ? t('auth.login') : t('auth.signup')}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            {!isForgotPassword && <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary hover:underline block w-full" disabled={loading}>
                {isLogin ? t('auth.noAccount') : t('auth.alreadyAccount')}
              </button>}
            
            {isLogin && !isForgotPassword && <button type="button" onClick={() => {
            setIsForgotPassword(true);
            setPassword("");
          }} className="text-sm text-muted-foreground hover:text-primary hover:underline block w-full" disabled={loading}>
                {t('auth.forgotPassword')}
              </button>}
            
            {isForgotPassword && <button type="button" onClick={() => {
            setIsForgotPassword(false);
            setEmail("");
          }} className="text-sm text-primary hover:underline block w-full" disabled={loading}>
                {t('auth.backToLogin')}
              </button>}
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;