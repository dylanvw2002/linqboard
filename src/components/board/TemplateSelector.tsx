import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  description: string;
  template_data: any;
}

interface TemplateSelectorProps {
  organizationId: string;
  onBoardCreated?: () => void;
}

export const TemplateSelector = ({
  organizationId,
  onBoardCreated,
}: TemplateSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("board_templates")
      .select("*")
      .eq("is_public", true);

    if (error) {
      console.error("Error loading templates:", error);
      return;
    }

    setTemplates(data || []);
  };

  const createFromTemplate = async (template: Template) => {
    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .insert({
        name: template.name,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (boardError || !boardData) {
      toast({
        title: "Fout",
        description: "Kon board niet aanmaken",
        variant: "destructive",
      });
      return;
    }

    const columns = template.template_data.columns || [];
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      await supabase.from("columns").insert({
        board_id: boardData.id,
        name: column.name,
        position: i,
        type: column.type || "default",
      });
    }

    toast({
      title: "Succes!",
      description: `Board "${template.name}" aangemaakt`,
    });

    setOpen(false);
    onBoardCreated?.();
  };

  const defaultTemplates: Template[] = [
    {
      id: "kanban",
      name: "Kanban Board",
      description: "Klassiek Kanban bord met To Do, Doing, Done",
      template_data: {
        columns: [
          { name: "To Do", type: "default" },
          { name: "Doing", type: "default" },
          { name: "Done", type: "default" },
        ],
      },
    },
    {
      id: "scrum",
      name: "Scrum Board",
      description: "Sprint planning met Backlog, Sprint, Review",
      template_data: {
        columns: [
          { name: "Backlog", type: "default" },
          { name: "Sprint", type: "default" },
          { name: "In Progress", type: "default" },
          { name: "Review", type: "default" },
          { name: "Done", type: "default" },
        ],
      },
    },
    {
      id: "marketing",
      name: "Marketing Campaign",
      description: "Ideaal voor marketing campagnes",
      template_data: {
        columns: [
          { name: "Ideeën", type: "default" },
          { name: "Planning", type: "default" },
          { name: "In Creatie", type: "default" },
          { name: "Review", type: "default" },
          { name: "Live", type: "default" },
        ],
      },
    },
    {
      id: "bug-tracking",
      name: "Bug Tracking",
      description: "Voor het volgen van bugs en issues",
      template_data: {
        columns: [
          { name: "Reported", type: "default" },
          { name: "Investigating", type: "default" },
          { name: "In Progress", type: "default" },
          { name: "Testing", type: "default" },
          { name: "Resolved", type: "default" },
        ],
      },
    },
  ];

  const allTemplates = [...defaultTemplates, ...templates];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Vanuit template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kies een template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {allTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => createFromTemplate(template)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  {template.name}
                </CardTitle>
                <CardDescription>{template.description}</CardDescription>
                <div className="text-xs text-muted-foreground mt-2">
                  {template.template_data.columns?.length || 0} kolommen
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
