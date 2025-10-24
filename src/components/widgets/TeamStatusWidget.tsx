import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Circle } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  status: "available" | "busy" | "away" | "offline";
}

interface TeamStatusWidgetProps {
  widgetId: string;
  boardId: string;
}

export const TeamStatusWidget = ({ widgetId, boardId }: TeamStatusWidgetProps) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadTeamMembers();
    getCurrentUser();
  }, [boardId]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user.id || null);
  };

  const loadTeamMembers = async () => {
    try {
      // Get board's organization
      const { data: board } = await supabase
        .from("boards")
        .select("organization_id")
        .eq("id", boardId)
        .single();

      if (!board) return;

      // Get all members of the organization
      const { data: memberships } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("organization_id", board.organization_id);

      if (!memberships) return;

      const userIds = memberships.map(m => m.user_id);

      // Get profiles for all members
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profiles) {
        setMembers(
          profiles.map((p) => ({
            ...p,
            status: "offline" as const,
          }))
        );
      }
    } catch (error: any) {
      console.error("Error loading team members:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "text-green-500";
      case "busy": return "text-red-500";
      case "away": return "text-yellow-500";
      default: return "text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available": return "Beschikbaar";
      case "busy": return "Bezig";
      case "away": return "Afwezig";
      default: return "Offline";
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">👥 Team Status</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {members.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Geen teamleden gevonden
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback>
                    {member.full_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Circle
                  className={`absolute bottom-0 right-0 h-3 w-3 fill-current ${getStatusColor(member.status)}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.full_name}</p>
                <p className={`text-xs ${getStatusColor(member.status)}`}>
                  {getStatusLabel(member.status)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Real-time status updates komen binnenkort
      </p>
    </div>
  );
};
