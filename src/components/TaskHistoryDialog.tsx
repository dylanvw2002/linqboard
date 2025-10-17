import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { TaskHistory } from "./TaskHistory";

interface TaskHistoryDialogProps {
  taskId: string;
  columns: Array<{ id: string; name: string }>;
}

export const TaskHistoryDialog = ({ taskId, columns }: TaskHistoryDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-white/50 dark:hover:bg-card/50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Geschiedenis</DialogTitle>
        </DialogHeader>
        <TaskHistory taskId={taskId} columns={columns} />
      </DialogContent>
    </Dialog>
  );
};
