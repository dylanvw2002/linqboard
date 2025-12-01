import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

interface ActiveUsersProps {
  organizationId: string;
  isDemo?: boolean;
  isMobile?: boolean;
}

interface UserPresence {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  online_at: string;
}

export const ActiveUsers = ({ organizationId, isDemo = false, isMobile = false }: ActiveUsersProps) => {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Demo mode: show mock active users
    if (isDemo) {
      const demoActiveUsers: UserPresence[] = [
        { 
          user_id: 'demo-user-1', 
          full_name: 'Sophie Bakker', 
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
          online_at: new Date().toISOString()
        },
        { 
          user_id: 'demo-user-2', 
          full_name: 'Tom Jansen', 
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom',
          online_at: new Date().toISOString()
        },
        { 
          user_id: 'demo-user-3', 
          full_name: 'Lisa Vermeer', 
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
          online_at: new Date().toISOString()
        }
      ];
      setActiveUsers(demoActiveUsers);
      return;
    }
    
    let roomChannel: RealtimeChannel | null = null;
    
    const setupPresence = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", session.user.id)
        .single();

      roomChannel = supabase.channel(`board:${organizationId}`, {
        config: {
          presence: {
            key: session.user.id,
          },
        },
      });

      const updatePresence = async () => {
        if (roomChannel) {
          await roomChannel.track({
            user_id: session.user.id,
            full_name: profile?.full_name || "Onbekende gebruiker",
            avatar_url: profile?.avatar_url || null,
            online_at: new Date().toISOString(),
          });
        }
      };

      roomChannel
        .on("presence", { event: "sync" }, () => {
          const state = roomChannel!.presenceState();
          const users: UserPresence[] = [];
          
          Object.keys(state).forEach((userId) => {
            const presences = state[userId] as any[];
            if (presences.length > 0) {
              users.push(presences[0] as UserPresence);
            }
          });
          
          setActiveUsers(users);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await updatePresence();
          }
        });

      setChannel(roomChannel);

      // Listen for profile updates and refresh presence
      const profileChannel = supabase
        .channel('profile-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${session.user.id}`
        }, async () => {
          // Refetch profile and update presence
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", session.user.id)
            .single();
          
          if (roomChannel && updatedProfile) {
            await roomChannel.track({
              user_id: session.user.id,
              full_name: updatedProfile.full_name || "Onbekende gebruiker",
              avatar_url: updatedProfile.avatar_url || null,
              online_at: new Date().toISOString(),
            });
          }
        })
        .subscribe();

      return profileChannel;
    };

    const profileChannelPromise = setupPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      profileChannelPromise.then(profileChannel => {
        if (profileChannel) {
          supabase.removeChannel(profileChannel);
        }
      });
    };
  }, [organizationId, isDemo]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={isMobile 
          ? "text-foreground font-bold cursor-pointer transition-all duration-300 flex items-center justify-center backdrop-blur-[60px] bg-white/30 dark:bg-card/30 border border-white/50 dark:border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] active:scale-95 hover:bg-white/40 dark:hover:bg-card/40 p-1.5 rounded-lg shrink-0 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/40 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[7px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none"
          : "backdrop-blur-sm bg-white/20 dark:bg-card/20 text-foreground border-2 border-white/40 dark:border-white/20 p-2.5 rounded-2xl font-bold cursor-pointer transition-transform duration-150 will-change-transform transform-gpu shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-card/30 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-150 after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none"
        }>
          <Users size={isMobile ? 20 : 20} />
          {activeUsers.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeUsers.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div>
          <h3 className="font-semibold text-sm mb-2">{t('board.activeUsers')}</h3>
          {activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('board.noActiveUsers')}</p>
          ) : (
            <ul className="space-y-2">
              {activeUsers.map((user) => (
                <li key={user.user_id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="h-8 w-8 border-2 border-green-500">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs font-bold bg-primary/30 text-primary">
                      {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{user.full_name}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
