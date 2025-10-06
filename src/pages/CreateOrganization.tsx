import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const CreateOrganization = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth?mode=create");
      }
    });
  }, [navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Refresh session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !session?.access_token) {
        toast.error(t('auth.loginError'));
        navigate("/auth?mode=create");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create_org", {
        body: { organizationName },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        
        // Check if it's a limit error
        if (error.message?.includes('limit') || error.message?.includes('403')) {
          toast.error(t('subscription.orgLimitReached'), {
            action: {
              label: t('subscription.upgrade'),
              onClick: () => navigate('/pricing')
            }
          });
          setLoading(false);
          return;
        }
        
        throw new Error(error.message || t('organization.createError'));
      }

      if (data?.error) {
        // Check if it's a limit error from the response
        if (data.error.includes('limit')) {
          toast.error(t('subscription.orgLimitReached'), {
            action: {
              label: t('subscription.upgrade'),
              onClick: () => navigate('/pricing')
            }
          });
          setLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      if (data?.organization?.invite_code) {
        setInviteCode(data.organization.invite_code);
        toast.success(t('organization.created'));
      } else {
        throw new Error(t('organization.createError'));
      }
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast.error(error.message || t('organization.createError'));
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success(t('common.download'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    navigate("/dashboard");
  };

  if (inviteCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-success to-primary/50 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-center">
              {t('organization.successTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('organization.shareCode')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                {t('organization.inviteCode')}
              </p>
              <div className="text-4xl font-bold text-center tracking-wider text-primary mb-4">
                {inviteCode}
              </div>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('common.download')}
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {t('common.code')}
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ {t('organization.successDescription')}</p>
            </div>

            <Button onClick={handleContinue} className="w-full" size="lg">
              {t('organization.goToDashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">
            {t('organization.createTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('organization.createDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">{t('organization.orgName')}</Label>
              <Input
                id="orgName"
                type="text"
                placeholder={t('organization.createPlaceholder')}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('organization.createButton')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/join-organization")}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {t('organization.orCreateNew')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateOrganization;
