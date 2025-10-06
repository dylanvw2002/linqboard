import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const JoinOrganization = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth?mode=join");
      }
    });
  }, [navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("join_org_with_code", {
        body: { inviteCode: inviteCode.toUpperCase() },
      });

      if (error) {
        // Check if it's a member limit error
        if (error.message?.includes('limit') || error.message?.includes('403')) {
          toast.error(t('subscription.memberLimitReached'));
          setLoading(false);
          return;
        }
        throw error;
      }

      // Check for limit error in response data
      if (data?.error && data.error.includes('limit')) {
        toast.error(t('subscription.memberLimitReached'));
        setLoading(false);
        return;
      }

      toast.success(data?.message || t('organization.joined'));
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || t('organization.joinError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">
            {t('organization.joinTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('organization.joinDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">{t('organization.inviteCode')}</Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder={t('organization.joinPlaceholder')}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
                maxLength={6}
                className="text-center text-2xl tracking-wider font-bold"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('organization.joinButton')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/create-organization")}
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

export default JoinOrganization;
