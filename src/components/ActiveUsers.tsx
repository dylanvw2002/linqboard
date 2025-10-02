import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users } from "lucide-react";
import { RealtimeChannel } from "@supabase/supabase-js";

interface ActiveUsersProps {
  organizationId: string;
}

interface UserPresence {
  user_id: string;
  full_name: string;
  online_at: string;
}

export const ActiveUsers = ({ organizationId }: ActiveUsersProps) => {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const setupPresence = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .single();

      const roomChannel = supabase.channel(`board:${organizationId}`, {
        config: {
          presence: {
            key: session.user.id,
          },
        },
      });

      roomChannel
        .on("presence", { event: "sync" }, () => {
          const state = roomChannel.presenceState();
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
            await roomChannel.track({
              user_id: session.user.id,
              full_name: profile?.full_name || "Onbekende gebruiker",
              online_at: new Date().toISOString(),
            });
          }
        });

      setChannel(roomChannel);
    };

    setupPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [organizationId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground border-2 border-white/40 dark:border-white/20 p-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-card/30 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none">
          <Users size={20} />
          {activeUsers.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeUsers.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div>
          <h3 className="font-semibold text-sm mb-2">Actieve gebruikers</h3>
          {activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen actieve gebruikers</p>
          ) : (
            <ul className="space-y-2">
              {activeUsers.map((user) => (
                <li key={user.user_id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{user.full_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
