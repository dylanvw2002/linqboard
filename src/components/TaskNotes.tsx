import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StickyNote, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface TaskNote {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

interface TaskNotesProps {
  taskId: string;
}

export function TaskNotes({ taskId }: TaskNotesProps) {
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from("task_notes")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(data.map((n: any) => n.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setNotes(data.map((n: any) => ({ ...n, profile: profileMap.get(n.user_id) })));
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchNotes();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });
  }, [fetchNotes]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setSubmitting(true);
    const { error } = await supabase.from("task_notes").insert({
      task_id: taskId,
      user_id: session.user.id,
      content: newNote.trim(),
    } as any);

    if (error) {
      toast.error("Kon opmerking niet toevoegen");
    } else {
      setNewNote("");
      await fetchNotes();
    }
    setSubmitting(false);
  };

  const deleteNote = async (id: string) => {
    await supabase.from("task_notes").delete().eq("id", id);
    fetchNotes();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-muted-foreground" />
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Opmerkingen {notes.length > 0 && `(${notes.length})`}
        </Label>
      </div>

      {/* Add note input */}
      <div className="flex gap-2">
        <Textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Schrijf een opmerking..."
          rows={2}
          className="resize-none text-sm"
        />
        <Button
          onClick={addNote}
          size="sm"
          disabled={!newNote.trim() || submitting}
          className="self-end"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="group rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-xs">
                    {note.profile?.full_name || "Onbekend"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(note.created_at), "dd MMM yyyy 'om' HH:mm", { locale: nl })}
                  </span>
                </div>
                {currentUserId === note.user_id && (
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-foreground/90 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
