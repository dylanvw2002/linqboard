import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const JoinOrganization = () => {
  const navigate = useNavigate();
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

      if (error) throw error;

      toast.success(data?.message || "Succesvol lid geworden!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Ongeldige code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">
            Sluit je aan bij een team
          </CardTitle>
          <CardDescription className="text-center">
            Voer de uitnodigingscode in die je hebt ontvangen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Uitnodigingscode</Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
                maxLength={6}
                className="text-center text-2xl tracking-wider font-bold"
              />
              <p className="text-xs text-muted-foreground text-center">
                6 karakters (letters en cijfers)
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lid worden...
                </>
              ) : (
                "Wordt lid"
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
              Nog geen code? Maak een organisatie
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinOrganization;
