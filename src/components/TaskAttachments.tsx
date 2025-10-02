import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Paperclip, X, FileText, Download, Upload, Eye } from "lucide-react";

interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

interface TaskAttachmentsProps {
  taskId: string;
}

export const TaskAttachments = ({ taskId }: TaskAttachmentsProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchAttachments();
    setupRealtimeSubscription();
  }, [taskId]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("task-attachments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_attachments",
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          fetchAttachments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    // Validatie
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      toast.error("Bestand is te groot. Maximale grootte is 10 MB");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Bestandstype niet ondersteund. Alleen PDF, Word, Excel en afbeeldingen zijn toegestaan");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      // Upload naar storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${taskId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Maak database entry
      const { error: dbError } = await supabase
        .from("task_attachments")
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast.success("Bestand geüpload");
    } catch (error: any) {
      toast.error("Fout bij uploaden: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await uploadFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await uploadFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };


  const handleView = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("task-attachments")
        .download(attachment.file_path);

      if (error) throw error;

      // Maak URL en open in nieuwe tab
      const url = URL.createObjectURL(data);
      window.open(url, "_blank");
      
      // Cleanup na een tijdje
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      toast.error("Fout bij openen: " + error.message);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("task-attachments")
        .download(attachment.file_path);

      if (error) throw error;

      // Maak download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Fout bij downloaden: " + error.message);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    try {
      // Verwijder uit storage
      const { error: storageError } = await supabase.storage
        .from("task-attachments")
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Verwijder uit database
      const { error: dbError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      toast.success("Bijlage verwijderd");
    } catch (error: any) {
      toast.error("Fout bij verwijderen: " + error.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
    if (fileType.includes("image")) return "🖼️";
    return "📎";
  };

  return (
    <div className="space-y-3">
      <Label>Bijlagen</Label>

      {/* Upload sectie */}
      <div 
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-border hover:bg-accent/5"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id={`file-upload-${taskId}`}
          className="hidden"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <label
          htmlFor={`file-upload-${taskId}`}
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            {uploading ? "Uploaden..." : "Sleep een bestand hierheen of klik om te uploaden"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, Word, Excel of afbeeldingen (max 10 MB)
          </p>
        </label>
      </div>

      {/* Bijlagen lijst */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Bijlagen laden...</div>
      ) : attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-accent/5 rounded-lg border border-border hover:bg-accent/10 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(attachment.file_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleView(attachment)}
                  title="Openen"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownload(attachment)}
                  title="Downloaden"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(attachment)}
                  title="Verwijderen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nog geen bijlagen toegevoegd</p>
      )}
    </div>
  );
};

export const AttachmentCount = ({ taskId }: { taskId: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchCount();
    setupRealtimeSubscription();
  }, [taskId]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`attachments-count-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_attachments",
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchCount = async () => {
    try {
      const { count: attachmentCount, error } = await supabase
        .from("task_attachments")
        .select("*", { count: "exact", head: true })
        .eq("task_id", taskId);

      if (error) throw error;
      setCount(attachmentCount || 0);
    } catch (error) {
      console.error("Error fetching attachment count:", error);
    }
  };

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border bg-primary/10 text-primary border-primary/20">
      <Paperclip className="w-3 h-3" />
      {count}
    </span>
  );
};
