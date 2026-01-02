import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Paperclip, X, FileText, Download, Upload, Eye, FileSpreadsheet, File, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useTranslation } from "react-i18next";

// PDF.js worker configureren
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
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
const FilePreview = ({
  attachment
}: {
  attachment: Attachment;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const loadPreview = async () => {
      try {
        const { data } = await supabase.storage
          .from("task-attachments")
          .download(attachment.file_path);
        
        if (mounted && data) {
          const blob = new Blob([data], { type: attachment.file_type });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Error loading preview:", error);
      }
    };
    
    if (attachment.file_type.includes("image") || attachment.file_type.includes("pdf")) {
      loadPreview();
    }
    
    return () => {
      mounted = false;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [attachment.id]);
  
  if (attachment.file_type.includes("image") && previewUrl) {
    return <img src={previewUrl} alt={attachment.file_name} className="w-12 h-12 object-cover rounded border border-border" />;
  }
  
  if (attachment.file_type.includes("pdf") && previewUrl) {
    return (
      <div className="w-12 h-12 border border-border rounded overflow-hidden bg-background">
        <Document file={previewUrl} loading={<div className="w-full h-full flex items-center justify-center"><FileText className="w-6 h-6 text-muted-foreground" /></div>} error={<div className="w-full h-full flex items-center justify-center">{getFileIcon(attachment.file_type)}</div>}>
          <Page pageNumber={1} width={48} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      </div>
    );
  }
  
  return <div className="w-12 h-12 flex items-center justify-center">{getFileIcon(attachment.file_type)}</div>;
};
export const TaskAttachments = ({
  taskId
}: TaskAttachmentsProps) => {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const fetchAttachments = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("task_attachments").select("*").eq("task_id", taskId).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAttachments();
    const channel = supabase.channel(`task-attachments-${taskId}`, {
      config: {
        broadcast: {
          self: true
        }
      }
    }).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "task_attachments",
      filter: `task_id=eq.${taskId}`
    }, payload => {
      fetchAttachments();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);
  const uploadFile = async (file: File) => {
    // Validatie
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      toast.error(t('attachments.fileTooLarge'));
      return;
    }
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('attachments.unsupportedType'));
      return;
    }
    setUploading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t('auth.notLoggedIn'));

      // Upload naar storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${taskId}/${Date.now()}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from("task-attachments").upload(fileName, file);
      if (uploadError) throw uploadError;

      // Maak database entry
      const {
        error: dbError
      } = await supabase.from("task_attachments").insert({
        task_id: taskId,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.id
      });
      if (dbError) throw dbError;

      // Direct de lijst opnieuw ophalen
      await fetchAttachments();

      // Trigger event voor count update
      window.dispatchEvent(new CustomEvent('attachment-uploaded', {
        detail: {
          taskId
        }
      }));
      toast.success(t('attachments.uploaded'));
    } catch (error: any) {
      toast.error(t('attachments.uploadError') + error.message);
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
      toast.success(t('attachments.loading'));

      // Download het bestand direct
      const {
        data,
        error
      } = await supabase.storage.from("task-attachments").download(attachment.file_path);
      if (error) throw error;

      // Maak een blob URL
      const blob = new Blob([data], {
        type: attachment.file_type
      });
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
      setViewingAttachment(attachment);
      setViewerOpen(true);
      toast.success(t('attachments.loaded'));
    } catch (error: any) {
      toast.error(t('attachments.openError') + error.message);
    }
  };
  const handleCloseViewer = () => {
    setViewerOpen(false);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
    setViewingAttachment(null);
    setPageNumber(1);
    setScale(1.0);
  };
  const onDocumentLoadSuccess = ({
    numPages
  }: {
    numPages: number;
  }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handlePreviousPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
  const handleDownload = async (attachment: Attachment) => {
    try {
      const {
        data,
        error
      } = await supabase.storage.from("task-attachments").download(attachment.file_path);
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
      toast.error(t('attachments.downloadError') + error.message);
    }
  };
  const handleDelete = async (attachment: Attachment) => {
    try {
      // Verwijder uit storage
      const {
        error: storageError
      } = await supabase.storage.from("task-attachments").remove([attachment.file_path]);
      if (storageError) throw storageError;

      // Verwijder uit database
      const {
        error: dbError
      } = await supabase.from("task_attachments").delete().eq("id", attachment.id);
      if (dbError) throw dbError;

      // Direct de lijst updaten zonder te wachten op realtime
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));

      // Trigger event voor count update
      window.dispatchEvent(new CustomEvent('attachment-deleted', {
        detail: {
          taskId
        }
      }));
      toast.success(t('attachments.deleted'));
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(t('attachments.deleteError') + error.message);
    }
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  return <>
      <div className="space-y-3">
        <Label>{t('attachments.title')}</Label>

      {/* Upload sectie */}
      <div className={`border-2 border-dashed rounded-lg p-4 transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border hover:bg-accent/5"}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        <input type="file" id={`file-upload-${taskId}`} className="hidden" onChange={handleFileUpload} disabled={uploading} />
        <label htmlFor={`file-upload-${taskId}`} className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            {uploading ? t('attachments.uploading') : t('attachments.dropOrClick')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('attachments.supportedTypes')}
          </p>
        </label>
      </div>

      {/* Bijlagen lijst */}
      {loading ? <div className="text-sm text-muted-foreground">{t('attachments.loadingAttachments')}</div> : attachments.length > 0 ? <div className="space-y-2">
          {attachments.map(attachment => <div key={attachment.id} className="flex items-center justify-between p-3 bg-accent/5 rounded-lg border border-border hover:bg-accent/10 transition-colors">
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(attachment)} title={t('common.open')}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(attachment)} title={t('common.download')}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(attachment)} title={t('common.delete')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>)}
        </div> : <p className="text-sm text-muted-foreground">{t('attachments.noAttachments')}</p>}
      </div>

      {/* File Viewer Modal */}
      <Dialog open={viewerOpen} onOpenChange={open => !open && handleCloseViewer()}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0 flex flex-col">
          <DialogHeader className="px-4 sm:px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between mx-0 sm:mx-[100px]">
              <span className="truncate text-sm sm:text-base pr-2">{viewingAttachment?.file_name}</span>
              <div className="flex gap-1.5 sm:gap-2 ml-0 sm:ml-4 flex-wrap">
                {viewingAttachment?.file_type.includes("pdf") && numPages > 0 && <>
                    <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5} className="h-8 w-8 sm:w-auto p-0 sm:px-3">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm flex items-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={scale >= 3.0} className="h-8 w-8 sm:w-auto p-0 sm:px-3">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px bg-border mx-1 sm:mx-2" />
                  </>}
                <Button variant="outline" size="sm" onClick={() => viewingAttachment && handleDownload(viewingAttachment)} className="h-8">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('common.download')}</span>
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 bg-muted/20">
            {fileUrl && viewingAttachment && <>
                {viewingAttachment.file_type.includes("image") ? <div className="w-full h-full flex items-center justify-center">
                    <img src={fileUrl} alt={viewingAttachment.file_name} className="max-w-full max-h-full object-contain" />
                  </div> : viewingAttachment.file_type.includes("pdf") ? <div className="flex flex-col items-center">
                    <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="flex items-center justify-center p-8">
                          <p className="text-muted-foreground">{t('attachments.loadingPDF')}</p>
                        </div>} error={<div className="flex items-center justify-center p-8 text-center">
                          <div>
                            <p className="text-destructive mb-4">
                              {t('attachments.pdfError')}
                            </p>
                            <Button onClick={() => viewingAttachment && handleDownload(viewingAttachment)}>
                              <Download className="h-4 w-4 mr-2" />
                              {t('attachments.downloadPDF')}
                            </Button>
                          </div>
                        </div>}>
                      <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
                    </Document>
                    {numPages > 1 && (
                      <div className="flex items-center gap-3 mt-4 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handlePreviousPage}
                          disabled={pageNumber <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm min-w-[80px] text-center">
                          {pageNumber} / {numPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleNextPage}
                          disabled={pageNumber >= numPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div> : <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Voorvertoning niet beschikbaar voor dit bestandstype
                      </p>
                      <Button onClick={() => viewingAttachment && handleDownload(viewingAttachment)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download bestand
                      </Button>
                    </div>
                  </div>}
              </>}
          </div>
        </DialogContent>
      </Dialog>
    </>;
};
export const AttachmentCount = ({
  taskId
}: {
  taskId: string;
}) => {
  const [count, setCount] = useState<number | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const fetchCount = useCallback(async () => {
    try {
      const {
        count: attachmentCount,
        error
      } = await supabase.from("task_attachments").select("*", {
        count: "exact",
        head: true
      }).eq("task_id", taskId);
      if (error) throw error;
      setCount(attachmentCount || 0);
    } catch (error) {
      console.error("Error fetching attachment count:", error);
    }
  }, [taskId]);

  const debouncedFetchCount = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchCount();
    }, 150);
  }, [fetchCount]);

  useEffect(() => {
    fetchCount();

    // Luister naar custom events voor directe updates
    const handleAttachmentChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.taskId === taskId) {
        debouncedFetchCount();
      }
    };
    window.addEventListener('attachment-deleted', handleAttachmentChange);
    window.addEventListener('attachment-uploaded', handleAttachmentChange);
    const channel = supabase.channel(`attachments-count-${taskId}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "task_attachments",
      filter: `task_id=eq.${taskId}`
    }, () => {
      debouncedFetchCount();
    }).subscribe();
    return () => {
      window.removeEventListener('attachment-deleted', handleAttachmentChange);
      window.removeEventListener('attachment-uploaded', handleAttachmentChange);
      supabase.removeChannel(channel);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [taskId, fetchCount, debouncedFetchCount]);

  // Tijdens laden of geen bijlagen: render niets maar stabiel
  if (count === null || count === 0) return null;
  
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border bg-primary/10 text-primary border-primary/20">
      <Paperclip className="w-3 h-3" />
      {count}
    </span>;
};