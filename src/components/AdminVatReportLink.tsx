import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function AdminVatReportLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Check if user is admin (using the admin user ID from migration)
      setIsAdmin(user?.id === '4a0b93e5-c165-4fdf-ae6d-b9bb9558aef9');
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <Link to="/vat-reports">
      <Button variant="outline" className="gap-2">
        <FileText className="h-4 w-4" />
        BTW Rapportage
      </Button>
    </Link>
  );
}
