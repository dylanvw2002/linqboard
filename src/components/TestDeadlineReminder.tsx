import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, AlertCircle } from "lucide-react";

interface TestDeadlineReminderProps {
  taskId: string;
}

export const TestDeadlineReminder = ({ taskId }: TestDeadlineReminderProps) => {
  const [loading, setLoading] = useState(false);

  const sendTestReminder = async (type: 'due_today' | 'overdue' | 'both') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-deadline-reminder', {
        body: { taskId, reminderType: type }
      });

      if (error) throw error;

      const successCount = data.results.filter((r: any) => r.success).length;
      const failCount = data.results.filter((r: any) => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} reminder email(s) verzonden!`);
      }
      
      if (failCount > 0) {
        toast.error(`${failCount} email(s) gefaald`);
      }

      console.log('Test reminder results:', data);
    } catch (error: any) {
      console.error('Error sending test reminder:', error);
      toast.error(error.message || 'Fout bij verzenden test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 p-4 bg-muted/50 rounded-lg border">
      <div className="flex-1">
        <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Test Deadline Reminders
        </h4>
        <p className="text-xs text-muted-foreground">
          Trigger deadline reminder emails direct (normaal om 08:00 UTC)
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => sendTestReminder('due_today')}
          disabled={loading}
        >
          Test "Vandaag"
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => sendTestReminder('overdue')}
          disabled={loading}
        >
          Test "Te Laat"
        </Button>
        <Button
          size="sm"
          onClick={() => sendTestReminder('both')}
          disabled={loading}
        >
          Beide
        </Button>
      </div>
    </div>
  );
};