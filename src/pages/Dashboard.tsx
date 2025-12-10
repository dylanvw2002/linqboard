import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LogOut, Loader2, Plus, ArrowRight, Trash2, User, Crown, FileText, Pencil, Share2, Users, Calendar, Clipboard, Target, Clock, CheckSquare, Archive, CheckCircle2, Zap, Paperclip, Layout, ChevronLeft, ChevronRight } from "lucide-react";
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
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { useTranslation } from "react-i18next";
import mascot from "@/assets/linqboard-mascot-new.png";
import logoText from "@/assets/logo-transparent.png";
interface Organization {
  id: string;
  name: string;
  invite_code: string;
  role: string;
}
interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  avatar_url: string | null;
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
  const {
    t
  } = useTranslation();
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editBoardId, setEditBoardId] = useState<string | null>(null);
  const [editBoardName, setEditBoardName] = useState("");
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState("");
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentQuote, setCurrentQuote] = useState("");

  const motivationalQuotes = [
    "Elke dag is een nieuwe kans om je doelen te bereiken!",
    "Kleine stappen leiden tot grote resultaten.",
    "Focus op vooruitgang, niet op perfectie.",
    "Jouw potentieel is onbeperkt!",
    "Blijf gemotiveerd en blijf groeien.",
    "Succes begint met de juiste mindset.",
    "Je bent dichter bij je doel dan je denkt!",
    "Consistentie is de sleutel tot succes.",
    "Geloof in jezelf en je mogelijkheden.",
    "Vandaag is de perfecte dag om te beginnen!",
    "Uitdagingen maken je sterker.",
    "Blijf doorgaan, je doet het geweldig!",
    "Elke poging brengt je dichter bij succes.",
    "Jouw inzet maakt het verschil.",
    "Geef nooit op, grote dingen kosten tijd!"
  ];
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Goedemorgen";
    if (hour >= 12 && hour < 18) return "Goedemiddag";
    if (hour >= 18 && hour < 24) return "Goedeavond";
    return "Goedenacht";
  };
  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch user profile and subscription
      await fetchUserData(session.user.id);
      await fetchOrganizations();

      // Check if user should see onboarding
      const hasSeenOnboarding = localStorage.getItem('onboarding_completed_v1');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }

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

  // Motivational quote rotation every hour
  useEffect(() => {
    const getRandomQuote = () => {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      return motivationalQuotes[randomIndex];
    };

    // Set initial quote
    setCurrentQuote(getRandomQuote());

    // Change quote every hour (3600000ms)
    const interval = setInterval(() => {
      setCurrentQuote(getRandomQuote());
    }, 3600000);

    return () => clearInterval(interval);
  }, []);
  const fetchUserData = async (userId: string) => {
    try {
      setUserId(userId);

      // Fetch profile
      const {
        data: profile
      } = await supabase.from('profiles').select('full_name, avatar_url').eq('user_id', userId).maybeSingle();
      if (profile) {
        setUserName(profile.full_name || "");
        setEditName(profile.full_name || "");
        setAvatarUrl(profile.avatar_url || null);
      }

      // Fetch subscription limits
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        const {
          data: limits
        } = await supabase.functions.invoke('get-subscription-status', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (limits) {
          setSubscriptionLimits(limits.limits);
          setSubscription(limits.subscription);
        }
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
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(filePath, blob);
      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile
      const {
        error: updateError
      } = await supabase.from('profiles').update({
        avatar_url: publicUrl
      }).eq('user_id', userId);
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
      const {
        error
      } = await supabase.from('profiles').update({
        full_name: editName
      }).eq('user_id', userId);
      if (error) throw error;
      setProfileDialogOpen(false);
      toast.success(t('dashboard.profileUpdated'));
      // Profile hook will auto-refetch
    } catch (error: any) {
      toast.error(t('dashboard.updateProfileError'));
      console.error(error);
    }
  };
  const handleUpdateBoardName = async () => {
    if (!editBoardId) return;
    const trimmedName = editBoardName.trim();
    if (!trimmedName) {
      toast.error(t('dashboard.nameRequired'));
      return;
    }
    try {
      const {
        error
      } = await supabase.from('organizations').update({
        name: trimmedName
      }).eq('id', editBoardId);
      if (error) throw error;

      // Update local state
      setOrganizations(organizations.map(org => org.id === editBoardId ? {
        ...org,
        name: trimmedName
      } : org));
      setEditBoardDialogOpen(false);
      setEditBoardId(null);
      setEditBoardName("");
      toast.success(t('dashboard.boardUpdated'));
    } catch (error: any) {
      toast.error(t('dashboard.updateBoardError'));
      console.error(error);
    }
  };
  const handleShareInviteLink = async (inviteCode: string) => {
    const inviteLink = `${window.location.origin}/join-organization?code=${inviteCode}`;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LinqBoard Uitnodiging',
          text: `Word lid van mijn team op LinqBoard! Gebruik code: ${inviteCode}`,
          url: inviteLink
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Share failed:', error);
          // Fallback to clipboard
          await copyToClipboard(inviteLink);
        }
      }
    } else {
      // Fallback to clipboard
      await copyToClipboard(inviteLink);
    }
  };
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('dashboard.inviteLinkCopied'));
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };
  const handleViewMembers = async (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId);
    setSelectedOrgName(orgName);
    setMembersDialogOpen(true);
    setLoadingMembers(true);
    try {
      // First get memberships
      const {
        data: memberships,
        error: membershipsError
      } = await supabase.from('memberships').select('id, user_id, role').eq('organization_id', orgId);
      if (membershipsError) throw membershipsError;

      // Then get profiles for those users
      const userIds = memberships?.map(m => m.user_id) || [];
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds);
      if (profilesError) throw profilesError;

      // Combine the data
      const members: OrganizationMember[] = (memberships || []).map(m => {
        const profile = profiles?.find(p => p.user_id === m.user_id);
        return {
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          full_name: profile?.full_name || 'Unknown',
          avatar_url: profile?.avatar_url || null
        };
      });
      setOrgMembers(members);
    } catch (error: any) {
      console.error(error);
      toast.error(t('dashboard.loadMembersError'));
    } finally {
      setLoadingMembers(false);
    }
  };
  const handleRemoveMember = async () => {
    if (!removeMemberId) return;
    try {
      const {
        error
      } = await supabase.from('memberships').delete().eq('id', removeMemberId);
      if (error) throw error;

      // Update local state
      setOrgMembers(orgMembers.filter(m => m.id !== removeMemberId));
      setRemoveMemberId(null);
      toast.success(t('dashboard.memberRemoved'));
    } catch (error: any) {
      console.error(error);
      toast.error(t('dashboard.removeMemberError'));
    }
  };
  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('cancel-mollie-subscription', {
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
      })).filter((org: any) => org.id && org.id !== '00000000-0000-0000-0000-000000000000' // Filter demo org uit
      ) || [];
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
    return <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('dashboard.title')}</p>
        </div>
      </div>;
  }
  return <div className="relative min-h-[100dvh] bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Background Icons Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Desktop icons */}
        <div className="hidden lg:block">
          <Calendar className="absolute top-[5%] left-[5%] w-10 h-10 text-primary opacity-5" />
          <Clipboard className="absolute top-[5%] left-[30%] w-10 h-10 text-primary opacity-5" />
          <FileText className="absolute top-[5%] left-[55%] w-10 h-10 text-primary opacity-5" />
          <Target className="absolute top-[5%] left-[80%] w-10 h-10 text-primary opacity-5" />
          
          <Clock className="absolute top-[20%] left-[10%] w-10 h-10 text-primary opacity-5" />
          <CheckSquare className="absolute top-[20%] left-[35%] w-10 h-10 text-primary opacity-5" />
          <Archive className="absolute top-[20%] left-[60%] w-10 h-10 text-primary opacity-5" />
          <CheckCircle2 className="absolute top-[20%] left-[85%] w-10 h-10 text-primary opacity-5" />
          
          <Zap className="absolute top-[35%] left-[5%] w-10 h-10 text-primary opacity-5" />
          <Paperclip className="absolute top-[35%] left-[30%] w-10 h-10 text-primary opacity-5" />
          <Layout className="absolute top-[35%] left-[55%] w-10 h-10 text-primary opacity-5" />
          <Calendar className="absolute top-[35%] left-[80%] w-10 h-10 text-primary opacity-5" />
          
          <Clipboard className="absolute top-[50%] left-[10%] w-10 h-10 text-primary opacity-5" />
          <FileText className="absolute top-[50%] left-[35%] w-10 h-10 text-primary opacity-5" />
          <Target className="absolute top-[50%] left-[60%] w-10 h-10 text-primary opacity-5" />
          <Clock className="absolute top-[50%] left-[85%] w-10 h-10 text-primary opacity-5" />
          
          <CheckSquare className="absolute top-[65%] left-[5%] w-10 h-10 text-primary opacity-5" />
          <Archive className="absolute top-[65%] left-[30%] w-10 h-10 text-primary opacity-5" />
          <CheckCircle2 className="absolute top-[65%] left-[55%] w-10 h-10 text-primary opacity-5" />
          <Zap className="absolute top-[65%] left-[80%] w-10 h-10 text-primary opacity-5" />
          
          <Paperclip className="absolute top-[80%] left-[10%] w-10 h-10 text-primary opacity-5" />
          <Layout className="absolute top-[80%] left-[35%] w-10 h-10 text-primary opacity-5" />
          <Calendar className="absolute top-[80%] left-[60%] w-10 h-10 text-primary opacity-5" />
          <Clipboard className="absolute top-[80%] left-[85%] w-10 h-10 text-primary opacity-5" />
        </div>
        
        {/* Mobile icons */}
        <div className="block lg:hidden">
          <Calendar className="absolute top-[10%] left-[10%] w-10 h-10 text-primary opacity-5" />
          <CheckSquare className="absolute top-[10%] right-[10%] w-10 h-10 text-primary opacity-5" />
          
          <Target className="absolute top-[30%] left-[10%] w-10 h-10 text-primary opacity-5" />
          <Clock className="absolute top-[30%] right-[10%] w-10 h-10 text-primary opacity-5" />
          
          <Zap className="absolute top-[50%] left-[10%] w-10 h-10 text-primary opacity-5" />
          <FileText className="absolute top-[50%] right-[10%] w-10 h-10 text-primary opacity-5" />
          
          <CheckCircle2 className="absolute top-[70%] left-[10%] w-10 h-10 text-primary opacity-5" />
          <Clipboard className="absolute top-[70%] right-[10%] w-10 h-10 text-primary opacity-5" />
          
          <Archive className="absolute top-[90%] left-[10%] w-10 h-10 text-primary opacity-5" />
          <Paperclip className="absolute top-[90%] right-[10%] w-10 h-10 text-primary opacity-5" />
        </div>
      </div>

      {/* Onboarding Guide */}
      <OnboardingGuide open={showOnboarding} onOpenChange={setShowOnboarding} />

      {/* Header - responsive */}
      <header className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-0 max-w-[1920px]">
          <div className="flex items-center justify-between gap-1">
            {/* Logo in header */}
            <img 
              src={logoText} 
              alt="LinqBoard" 
              className="h-20 sm:h-24 lg:h-28 xl:h-32 w-auto cursor-pointer hover:scale-105 transition-transform -my-6" 
              onClick={() => navigate("/")} 
            />
            <div className="flex items-center gap-2 lg:gap-3">
              <AdminVatReportLink />
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 lg:h-10 lg:w-10 rounded-full">
                    <Avatar className="h-9 w-9 lg:h-10 lg:w-10 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-sm">
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
                  {subscriptionLimits?.plan !== 'free' && <DropdownMenuItem onClick={() => navigate('/invoices')} className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Bekijk facturen</span>
                    </DropdownMenuItem>}
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

      {/* Logo linksonder met quote bubble - responsive */}
      <div className="fixed bottom-0 left-2 sm:left-4 lg:left-6 xl:left-8 z-20 hidden lg:block">
        {currentQuote && (
          <div className="absolute bottom-full left-20 sm:left-24 lg:left-28 xl:left-32 mb-3 lg:mb-4 animate-fade-in">
            <div className="relative bg-white dark:bg-white text-foreground px-4 sm:px-5 lg:px-6 py-2.5 lg:py-3 rounded-2xl shadow-lg">
              <p className="text-xs sm:text-sm lg:text-base font-medium whitespace-nowrap">{currentQuote}</p>
              {/* Speech bubble pointer - 45 degree angle from bottom-left corner */}
              <div 
                className="absolute -bottom-4 left-0 w-0 h-0"
                style={{
                  borderLeft: '20px solid transparent',
                  borderTop: '20px solid white',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'top left'
                }}
              ></div>
            </div>
          </div>
        )}
        <img src={mascot} alt="LinqBoard Mascot" className="h-32 sm:h-36 lg:h-40 xl:h-44 w-auto cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/")} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 lg:py-6 pb-8 lg:pb-12 max-w-[1920px]">
        {/* Welcome Section - responsive text */}
        <div className="mb-4 lg:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1.5 lg:mb-2 flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {getTimeBasedGreeting()} {userName}
            </span>
            
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            {t('dashboard.welcomeBack')}
          </p>
        </div>

        {/* Organizations - responsive grid */}
        <div className="mb-4 lg:mb-6">
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold">
              {t('dashboard.yourOrganizations')}
              {subscriptionLimits && <span className="text-muted-foreground text-xs sm:text-sm lg:text-base ml-1.5">
                  ({subscriptionLimits.current_org_count}/{subscriptionLimits.max_organizations === -1 ? '∞' : subscriptionLimits.max_organizations})
                </span>}
            </h2>
          </div>
          
          {organizations.length === 0 ? <Card className="p-4 sm:p-5 lg:p-6 xl:p-8 text-center border-2 border-dashed border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="max-w-sm mx-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary" />
                </div>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-3 lg:mb-4">
                  {t('dashboard.noOrganizations')}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 justify-center">
                  <Button size="sm" onClick={() => navigate("/create-organization")} className="shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm lg:text-base">
                    <Plus className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {t('dashboard.createOrganization')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/join-organization")} className="border-2 text-xs sm:text-sm lg:text-base">
                    {t('dashboard.joinOrganization')}
                  </Button>
                </div>
              </div>
            </Card> : <div className="relative">
              {/* Navigation Buttons - responsive */}
              {organizations.length > 3 && currentPage > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 border-border/50 shadow-lg hover:shadow-xl hover:border-primary/50"
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </Button>
              )}
              
              {organizations.length > 3 && currentPage < Math.ceil(organizations.length / 3) - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 border-border/50 shadow-lg hover:shadow-xl hover:border-primary/50"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </Button>
              )}

              <div className="grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 xl:gap-5">
              {organizations.slice(currentPage * 3, (currentPage + 1) * 3).map(org => <Card key={org.id} className="p-3 lg:p-4 xl:p-5 hover:shadow-xl transition-all border-2 border-border/50 hover:border-primary/50 bg-card/80 backdrop-blur-sm group relative">
                  {org.role === 'owner' ? <>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-[72px] lg:right-[80px] xl:right-[88px] text-muted-foreground hover:text-primary hover:bg-primary/10 z-10 h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" onClick={e => {
                e.stopPropagation();
                setEditBoardId(org.id);
                setEditBoardName(org.name);
                setEditBoardDialogOpen(true);
              }}>
                      <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-[40px] lg:right-[44px] xl:right-[48px] text-muted-foreground hover:text-primary hover:bg-primary/10 z-10 h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" onClick={e => {
                e.stopPropagation();
                handleViewMembers(org.id, org.name);
              }}>
                      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10 z-10 h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" onClick={e => {
                e.stopPropagation();
                setDeleteOrgId(org.id);
              }}>
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                    </Button>
                  </> : <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10 text-xs px-2 h-6 sm:h-7 lg:h-8" onClick={e => {
              e.stopPropagation();
              setLeaveOrgId(org.id);
            }}>
                      {t('dashboard.leave')}
                    </Button>}
                  <div className="cursor-pointer" onClick={() => handleOpenBoard(org.id)}>
                    <div className="mb-3 lg:mb-4">
                      <h3 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold mb-1.5 lg:mb-2 group-hover:text-primary transition-colors pr-8">{org.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs lg:text-sm text-muted-foreground">
                        <span>{t('common.code')}:</span>
                        <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs lg:text-sm">
                          {org.invite_code}
                        </span>
                        {org.role === 'owner' && <Button variant="ghost" size="sm" className="h-5 w-5 sm:h-6 sm:w-6 p-0" onClick={e => {
                    e.stopPropagation();
                    handleShareInviteLink(org.invite_code);
                  }} title={t('dashboard.shareInviteLink')}>
                            <Share2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5" />
                          </Button>}
                      </div>
                    </div>
                    <Button className="w-full shadow-lg hover:shadow-xl transition-all group-hover:scale-105 text-xs sm:text-sm lg:text-base h-7 sm:h-8 lg:h-9">
                      {t('dashboard.openBoard')}
                      <ArrowRight className="ml-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                    </Button>
                  </div>
                </Card>)}
              </div>
            </div>}
        </div>

        {/* Quick actions - responsive */}
        <div className="border-t border-border/50 pt-4 lg:pt-6 pb-0">
            <h3 className="text-xs sm:text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-muted-foreground">{t('dashboard.quickActions')}</h3>
            <div className="flex flex-wrap gap-2 lg:gap-3">
              <Button size="sm" variant="outline" onClick={() => navigate("/create-organization")} className="border-2 text-xs sm:text-sm lg:text-base h-7 sm:h-8 lg:h-9" disabled={subscriptionLimits ? subscriptionLimits.current_org_count >= subscriptionLimits.max_organizations && subscriptionLimits.max_organizations !== -1 : false}>
                <Plus className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                {t('dashboard.newOrganization')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/join-organization")} className="border-2 text-xs sm:text-sm lg:text-base h-7 sm:h-8 lg:h-9">
                {t('dashboard.joinTeam')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/pricing")} className="border-2 text-xs sm:text-sm lg:text-base h-7 sm:h-8 lg:h-9">
                {t('subscription.viewPlans')}
              </Button>
            </div>
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
              <Button variant="outline" size="sm" onClick={() => setAvatarUploadOpen(true)}>
                {t('dashboard.changePhoto')}
              </Button>
            </div>

            {/* Name input */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('dashboard.nameLabel')}</Label>
              <Input id="name" value={editName} onChange={e => setEditName(e.target.value)} placeholder={t('dashboard.namePlaceholder')} />
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
      <AvatarUploadDialog open={avatarUploadOpen} onOpenChange={setAvatarUploadOpen} onUpload={handleAvatarUpload} />

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
            <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={cancelling}>
              {cancelling ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </> : t('subscription.cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Board Name Dialog */}
      <Dialog open={editBoardDialogOpen} onOpenChange={setEditBoardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.editBoardTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="boardName">{t('dashboard.boardNameLabel')}</Label>
              <Input id="boardName" value={editBoardName} onChange={e => setEditBoardName(e.target.value)} placeholder={t('dashboard.boardNamePlaceholder')} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
              setEditBoardDialogOpen(false);
              setEditBoardId(null);
              setEditBoardName("");
            }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdateBoardName}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboard.members')} - {selectedOrgName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loadingMembers ? <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div> : orgMembers.length === 0 ? <p className="text-center text-muted-foreground py-8">
                {t('dashboard.noOrganizations')}
              </p> : <div className="space-y-2">
                {orgMembers.map(member => <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.role === 'owner' ? t('dashboard.owner') : t('dashboard.member')}
                        </p>
                      </div>
                    </div>
                    {member.role !== 'owner' && member.user_id !== userId && <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setRemoveMemberId(member.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>}
                  </div>)}
              </div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!removeMemberId} onOpenChange={open => !open && setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.removeMemberTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.removeMemberDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('dashboard.removeMember')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SupportButton />
    </div>;
};
export default Dashboard;