import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Loader2, Plus } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  invite_code: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    checkUser();
    fetchOrganizations();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", session.user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // Get user's memberships
      const { data: memberships, error } = await supabase
        .from("memberships")
        .select(`
          organization_id,
          organizations (
            id,
            name,
            invite_code
          )
        `)
        .eq("user_id", session.user.id);

      if (error) throw error;

      const orgs = memberships
        ?.map((m: any) => m.organizations)
        .filter(Boolean) || [];
      
      setOrganizations(orgs);
    } catch (error: any) {
      toast.error("Fout bij laden van organisaties");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleOpenBoard = (orgId: string) => {
    navigate(`/board/${orgId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Hoi {userName || "daar"} 👋
            </h1>
            <p className="text-muted-foreground">
              Welkom terug op je dashboard
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Uitloggen
          </Button>
        </div>

        {/* Organizations */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Jouw organisaties</h2>
          
          {organizations.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Je bent nog geen lid van een organisatie
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate("/create-organization")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Maak organisatie
                </Button>
                <Button variant="outline" onClick={() => navigate("/join-organization")}>
                  Voeg code in
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <Card
                  key={org.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleOpenBoard(org.id)}
                >
                  <h3 className="text-xl font-semibold mb-2">{org.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Code: <span className="font-mono font-bold">{org.invite_code}</span>
                  </p>
                  <Button className="w-full">
                    Open board
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        {organizations.length > 0 && (
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/create-organization")}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe organisatie
            </Button>
            <Button variant="outline" onClick={() => navigate("/join-organization")}>
              Sluit je aan bij team
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
