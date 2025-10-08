import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LogOut, Loader2, Plus, ArrowRight, Trash2, PartyPopper, User, Crown, FileText } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AvatarUploadDialog } from "@/components/AvatarUploadDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import SupportButton from "@/components/SupportButton";
import AdminVatReportLink from "@/components/AdminVatReportLink";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo-transparent.png";

interface Organization {
  id: string;
  name: string;
  invite_code: string;
  role: string;
}

interface SubscriptionLimits {
  plan: string;
  max_organizations: number;
  max_members_per_org: number;
  current_org_count: number;
}

interface Subscription {
  plan: string;
  status: string;
  billing_interval?: string;
  current_period_end?: string;
  mollie_customer_id?: string;
  mollie_subscription_id?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);
  const [leaveOrgId, setLeaveOrgId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [subscriptionLimits, setSubscriptionLimits] = useState<SubscriptionLimits | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // Fetch user profile and subscription
      await fetchUserData(session.user.id);
      await fetchOrganizations();
      
      // Check for subscription success message
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('subscription') === 'success') {
        toast.success(t('subscription.activationSuccess') || 'Subscription activated successfully!');
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      }
    };
    
    checkAccess();
  }, [navigate]);
  
  const fetchUserData = async (userId: string) => {
    try {
      setUserId(userId);
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profile) {
        setUserName(profile.full_name || "");
        setEditName(profile.full_name || "");
        setAvatarUrl(profile.avatar_url || null);
      }
      
      // Fetch subscription limits
      const { data: limits } = await supabase.functions.invoke('get-subscription-status');
      if (limits) {
        setSubscriptionLimits(limits.limits);
        setSubscription(limits.subscription);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleAvatarUpload = async (blob: Blob) => {
    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileName = `${Math.random()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      toast.success(t('dashboard.avatarUpdated'));
      // Profile hook will auto-refetch
    } catch (error: any) {
      toast.error(t('dashboard.uploadError'));
      console.error(error);
    }
  };


  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toast.error(t('dashboard.nameRequired'));
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName })
        .eq('user_id', userId);

      if (error) throw error;

      setProfileDialogOpen(false);
      toast.success(t('dashboard.profileUpdated'));
      // Profile hook will auto-refetch
    } catch (error: any) {
      toast.error(t('dashboard.updateProfileError'));
      console.error(error);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('cancel-mollie-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success(t('subscription.cancelled'));
      setCancelDialogOpen(false);
      
      // Refresh subscription data
      await fetchUserData(userId);
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || t('subscription.cancelError'));
    } finally {
      setCancelling(false);
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
      toast.error(t('dashboard.loadOrgsError'));
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
      toast.success(t('dashboard.orgDeletedSuccess'));
      setOrganizations(organizations.filter(org => org.id !== deleteOrgId));
      setDeleteOrgId(null);
    } catch (error: any) {
      toast.error(t('dashboard.deleteOrgError'));
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
      toast.success(t('dashboard.orgLeftSuccess'));
      setOrganizations(organizations.filter(org => org.id !== leaveOrgId));
      setLeaveOrgId(null);
    } catch (error: any) {
      toast.error(t('dashboard.leaveOrgError'));
      console.error(error);
    }
  };
  const isPageLoading = loading;

  if (isPageLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('dashboard.title')}</p>
        </div>
      </div>;
  }
  return <div className="relative min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-6 py-0">
          <div className="flex items-center justify-between gap-4">
            <img src={logo} alt="LinqBoard Logo" className="h-48 w-auto cursor-pointer" onClick={() => navigate("/")} />
            <div className="flex items-center gap-4">
              <AdminVatReportLink />
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-full">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-lg">
                        {userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[100] bg-card">
                  <DropdownMenuItem onClick={() => setProfileDialogOpen(true)} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('dashboard.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('auth.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline-block pb-3 leading-tight">
              {t('dashboard.hello')} {userName || t('dashboard.hello')}
            </span>
            <PartyPopper className="text-accent" size={56} />
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('dashboard.welcomeBack')}
          </p>
        </div>

        {/* Subscription Status Card */}
        {subscriptionLimits && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold">
                    {t('subscription.yourPlan')}: <span className="text-primary capitalize">{subscriptionLimits.plan}</span>
                  </h3>
                </div>
                {subscription && subscription.status && (
                  <div className="mb-3">
                    <span className="text-sm text-muted-foreground">
                      {t('subscription.status')}:{" "}
                      <span className={`font-semibold ${
                        subscription.status === 'active' ? 'text-green-600' : 
                        subscription.status === 'canceled' ? 'text-orange-600' : 
                        'text-red-600'
                      }`}>
                        {subscription.status === 'active' && 'Actief'}
                        {subscription.status === 'canceled' && 'Geannuleerd'}
                        {subscription.status === 'past_due' && 'Betaling achterstallig'}
                        {subscription.status === 'pending' && 'In behandeling'}
                      </span>
                    </span>
                    {subscription.billing_interval && (
                      <span className="text-sm text-muted-foreground ml-4">
                        • {subscription.billing_interval === 'monthly' ? 'Maandelijks' : 'Jaarlijks'}
                      </span>
                    )}
                    {subscription.current_period_end && (
                      <span className="text-sm text-muted-foreground ml-4">
                        • Verlengt op {new Date(subscription.current_period_end).toLocaleDateString('nl-NL')}
                      </span>
                    )}
                  </div>
                )}
                <div className="space-y-3 mt-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t('subscription.organizations')}</span>
                      <span className="font-semibold">
                        {subscriptionLimits.current_org_count}/{subscriptionLimits.max_organizations === -1 ? '∞' : subscriptionLimits.max_organizations}
                      </span>
                    </div>
                    <Progress 
                      value={subscriptionLimits.max_organizations === -1 ? 0 : (subscriptionLimits.current_org_count / subscriptionLimits.max_organizations) * 100} 
                      className="h-2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('subscription.membersPerOrg')}: {subscriptionLimits.max_members_per_org === -1 ? '∞' : subscriptionLimits.max_members_per_org}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {subscriptionLimits.plan !== 'free' && (
                  <Button 
                    onClick={() => navigate('/invoices')} 
                    size="lg"
                    variant="outline"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Bekijk facturen
                  </Button>
                )}
                {subscriptionLimits.plan !== 'business' && (
                  <Button onClick={() => navigate('/pricing')} size="lg">
                    {t('subscription.upgrade')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {subscription && subscription.mollie_subscription_id && subscription.status === 'active' && (
                  <Button 
                    onClick={() => setCancelDialogOpen(true)} 
                    size="lg" 
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {t('subscription.cancel')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Organizations */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">
              {t('dashboard.yourOrganizations')}
              {subscriptionLimits && (
                <span className="text-muted-foreground text-xl ml-3">
                  ({subscriptionLimits.current_org_count}/{subscriptionLimits.max_organizations === -1 ? '∞' : subscriptionLimits.max_organizations})
                </span>
              )}
            </h2>
            {organizations.length > 0 && (
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/create-organization")} 
                  className="border-2"
                  disabled={subscriptionLimits ? subscriptionLimits.current_org_count >= subscriptionLimits.max_organizations && subscriptionLimits.max_organizations !== -1 : false}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {t('dashboard.newOrganization')}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/join-organization")} className="border-2">
                  {t('dashboard.joinTeam')}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="border-2">
                  {t('subscription.viewPlans')}
                </Button>
              </div>
            )}
          </div>
          
          {organizations.length === 0 ? <Card className="p-12 text-center border-2 border-dashed border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
                  <Plus className="h-10 w-10 text-primary" />
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  {t('dashboard.noOrganizations')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={() => navigate("/create-organization")} className="shadow-lg hover:shadow-xl transition-all">
                    <Plus className="mr-2 h-5 w-5" />
                    {t('dashboard.createOrganization')}
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/join-organization")} className="border-2">
                    {t('dashboard.joinOrganization')}
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
                      {t('dashboard.leave')}
                    </Button>}
                  <div className="cursor-pointer" onClick={() => handleOpenBoard(org.id)}>
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors pr-8">{org.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t('common.code')}:</span>
                        <span className="font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                          {org.invite_code}
                        </span>
                      </div>
                    </div>
                    <Button className="w-full shadow-lg hover:shadow-xl transition-all group-hover:scale-105">
                      {t('dashboard.openBoard')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>)}
            </div>}
        </div>

      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteOrgId} onOpenChange={open => !open && setDeleteOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.deleteOrgTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.deleteOrgDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrganization} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('dashboard.deleteOrgConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave confirmation dialog */}
      <AlertDialog open={!!leaveOrgId} onOpenChange={open => !open && setLeaveOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.leaveOrgTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.leaveOrgDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveOrganization} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('dashboard.leaveOrgConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Edit Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboard.profileTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Avatar display section */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-3xl">
                  {userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAvatarUploadOpen(true)}
              >
                {t('dashboard.changePhoto')}
              </Button>
            </div>

            {/* Name input */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('dashboard.nameLabel')}</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t('dashboard.namePlaceholder')}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdateProfile}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Upload Dialog */}
      <AvatarUploadDialog
        open={avatarUploadOpen}
        onOpenChange={setAvatarUploadOpen}
        onUpload={handleAvatarUpload}
      />

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('subscription.cancelConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('subscription.cancelDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubscription} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('subscription.cancel')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SupportButton />
    </div>;
};
export default Dashboard;