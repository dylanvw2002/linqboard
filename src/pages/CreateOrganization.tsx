import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle } from "lucide-react";

const CreateOrganization = () => {
  const navigate = useNavigate();
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("create_org", {
        body: { organizationName },
      });

      if (error) throw error;

      if (data?.organization?.invite_code) {
        setInviteCode(data.organization.invite_code);
        toast.success("Organisatie succesvol aangemaakt!");
      }
    } catch (error: any) {
      toast.error(error.message || "Er is iets misgegaan");
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Code gekopieerd!");
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
              Organisatie aangemaakt!
            </CardTitle>
            <CardDescription className="text-center">
              Deel deze code met je teamleden
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                Jouw uitnodigingscode
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
                    Gekopieerd!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Kopieer code
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Je standaard board is aangemaakt</p>
              <p>✓ Team members kunnen nu lid worden</p>
              <p>✓ Begin direct met taken toevoegen</p>
            </div>

            <Button onClick={handleContinue} className="w-full" size="lg">
              Ga naar dashboard
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
            Maak een organisatie
          </CardTitle>
          <CardDescription className="text-center">
            Start je team en ontvang een uitnodigingscode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organisatienaam</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="Mijn Geweldige Team"
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
                  Organisatie aanmaken...
                </>
              ) : (
                "Maak organisatie"
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
              Heb je al een code? Sluit je aan
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateOrganization;
