import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Paperclip, X, FileText, Download, Upload, Eye, FileSpreadsheet, File } from "lucide-react";

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

const getFileIcon = (fileType: string) => {
  if (fileType.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
  if (fileType.includes("word")) return <FileText className="w-8 h-8 text-blue-500" />;
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
  return <File className="w-8 h-8 text-muted-foreground" />;
};

const FilePreview = ({ attachment }: { attachment: Attachment }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!attachment.file_type.includes("image")) return;
    
    let mounted = true;
    
    supabase.storage
      .from("task-attachments")
      .createSignedUrl(attachment.file_path, 3600)
      .then(({ data }) => {
        if (mounted && data?.signedUrl) {
          setPreviewUrl(data.signedUrl);
        }
      });
    
    return () => {
      mounted = false;
    };
  }, [attachment.id]);

  if (attachment.file_type.includes("image") && previewUrl) {
    return (
      <img 
        src={previewUrl} 
        alt={attachment.file_name}
        className="w-12 h-12 object-cover rounded border border-border"
      />
    );
  }

  return <div className="w-12 h-12 flex items-center justify-center">{getFileIcon(attachment.file_type)}</div>;
};

export const TaskAttachments = ({ taskId }: TaskAttachmentsProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchAttachments();
    
    const channel = supabase
      .channel(`task-attachments-${taskId}`)
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
  }, [taskId]);

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
      // Download het bestand als blob
      const { data, error } = await supabase.storage
        .from("task-attachments")
        .download(attachment.file_path);

      if (error) throw error;

      // Maak een blob URL
      const blob = new Blob([data], { type: attachment.file_type });
      const blobUrl = URL.createObjectURL(blob);
      
      // Maak download link (werkt altijd, geen popup blocker)
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = attachment.file_name; // Download i.p.v. openen
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
      
      toast.success("Bestand wordt gedownload");
    } catch (error: any) {
      toast.error("Fout bij downloaden: " + error.message);
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
      console.log("Deleting attachment:", attachment);
      
      // Verwijder uit storage
      const { error: storageError } = await supabase.storage
        .from("task-attachments")
        .remove([attachment.file_path]);

      console.log("Storage delete result:", { error: storageError });
      if (storageError) throw storageError;

      // Verwijder uit database
      const { error: dbError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachment.id);

      console.log("Database delete result:", { error: dbError });
      if (dbError) throw dbError;

      toast.success("Bijlage verwijderd");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Fout bij verwijderen: " + error.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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
                <FilePreview attachment={attachment} />
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
  }, [taskId]);

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
