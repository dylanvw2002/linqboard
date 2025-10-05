import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Loader2, Plus, ArrowRight, Trash2, PartyPopper } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import logo from "@/assets/logo-transparent.png";
interface Organization {
  id: string;
  name: string;
  invite_code: string;
  role: string;
}
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userName, setUserName] = useState("");
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);
  const [leaveOrgId, setLeaveOrgId] = useState<string | null>(null);
  useEffect(() => {
    checkUser();
    fetchOrganizations();
  }, []);
  const checkUser = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Get user profile
    const {
      data: profile
    } = await supabase.from("profiles").select("full_name").eq("user_id", session.user.id).single();
    if (profile) {
      setUserName(profile.full_name);
    }
  };
  const fetchOrganizations = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's memberships with role
      const {
        data: memberships,
        error
      } = await supabase.from("memberships").select(`
          role,
          organizations (
            id,
            name,
            invite_code
          )
        `).eq("user_id", session.user.id);
      if (error) throw error;
      const orgs = memberships?.map((m: any) => ({
        ...m.organizations,
        role: m.role
      })).filter((org: any) => org.id) || [];
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
  const handleDeleteOrganization = async () => {
    if (!deleteOrgId) return;
    try {
      const {
        error
      } = await supabase.from("organizations").delete().eq("id", deleteOrgId);
      if (error) throw error;
      toast.success("Organisatie succesvol verwijderd");
      setOrganizations(organizations.filter(org => org.id !== deleteOrgId));
      setDeleteOrgId(null);
    } catch (error: any) {
      toast.error("Fout bij verwijderen van organisatie");
      console.error(error);
    }
  };
  const handleLeaveOrganization = async () => {
    if (!leaveOrgId) return;
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) return;
      const {
        error
      } = await supabase.from("memberships").delete().eq("organization_id", leaveOrgId).eq("user_id", session.user.id);
      if (error) throw error;
      toast.success("Je hebt de organisatie verlaten");
      setOrganizations(organizations.filter(org => org.id !== leaveOrgId));
      setLeaveOrgId(null);
    } catch (error: any) {
      toast.error("Fout bij verlaten van organisatie");
      console.error(error);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Dashboard laden...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-6 py-0">
          <div className="flex items-center justify-between gap-4">
            <img src={logo} alt="LinqBoard Logo" className="h-48 w-auto cursor-pointer" onClick={() => navigate("/")} />
            <Button variant="outline" onClick={handleLogout} size="lg" className="border-2">
              <LogOut className="mr-2 h-5 w-5" />
              Uitloggen
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 pb-2 flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent my-0 py-[2px]">
              Hoi {userName || "daar"}
            </span>
            <PartyPopper className="text-accent" size={56} />
          </h1>
          <p className="text-xl text-muted-foreground">
            Welkom terug op je dashboard
          </p>
        </div>

        {/* Organizations */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Jouw organisaties</h2>
          
          {organizations.length === 0 ? <Card className="p-12 text-center border-2 border-dashed border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
                  <Plus className="h-10 w-10 text-primary" />
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  Je bent nog geen lid van een organisatie. Begin nu met het maken van je eerste team!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={() => navigate("/create-organization")} className="shadow-lg hover:shadow-xl transition-all">
                    <Plus className="mr-2 h-5 w-5" />
                    Maak organisatie
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/join-organization")} className="border-2">
                    Voeg code in
                  </Button>
                </div>
              </div>
            </Card> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map(org => <Card key={org.id} className="p-8 hover:shadow-xl transition-all border-2 border-border/50 hover:border-primary/50 bg-card/80 backdrop-blur-sm group relative">
                  {org.role === 'owner' ? <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-destructive hover:text-destructive hover:bg-destructive/10 z-10" onClick={e => {
              e.stopPropagation();
              setDeleteOrgId(org.id);
            }}>
                      <Trash2 className="h-5 w-5" />
                    </Button> : <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10" onClick={e => {
              e.stopPropagation();
              setLeaveOrgId(org.id);
            }}>
                      Verlaat
                    </Button>}
                  <div className="cursor-pointer" onClick={() => handleOpenBoard(org.id)}>
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors pr-8">{org.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Code:</span>
                        <span className="font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                          {org.invite_code}
                        </span>
                      </div>
                    </div>
                    <Button className="w-full shadow-lg hover:shadow-xl transition-all group-hover:scale-105">
                      Open board
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>)}
            </div>}
        </div>

        {/* Quick actions */}
        {organizations.length > 0 && <div className="border-t border-border/50 pt-8">
            <h3 className="text-xl font-semibold mb-4 text-muted-foreground">Snelle acties</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="outline" onClick={() => navigate("/create-organization")} className="border-2">
                <Plus className="mr-2 h-5 w-5" />
                Nieuwe organisatie
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/join-organization")} className="border-2">
                Sluit je aan bij team
              </Button>
            </div>
          </div>}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteOrgId} onOpenChange={open => !open && setDeleteOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt. Dit zal permanent de organisatie en alle bijbehorende boards, taken en data verwijderen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrganization} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Definitief verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave confirmation dialog */}
      <AlertDialog open={!!leaveOrgId} onOpenChange={open => !open && setLeaveOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Organisatie verlaten?</AlertDialogTitle>
            <AlertDialogDescription>
              Je zult geen toegang meer hebben tot deze organisatie. Je kunt alleen opnieuw lid worden met een uitnodigingscode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveOrganization} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Verlaat organisatie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Dashboard;