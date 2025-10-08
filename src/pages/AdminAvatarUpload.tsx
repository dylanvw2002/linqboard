import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import corrieAvatar from "@/assets/corrie.jpeg";

const AdminAvatarUpload = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const uploadAvatarForCorrie = async () => {
      try {
        setResult("Bezig met uploaden...");
        
        // Convert image to base64
        const response = await fetch(corrieAvatar);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Call edge function
        const { data, error } = await supabase.functions.invoke('upload-avatar-for-user', {
          body: {
            email: 'c.kooij@nrgtotaal.nl',
            imageBase64: base64
          }
        });

        if (error) throw error;

        setResult(`✅ Succes! Avatar geüpload voor c.kooij@nrgtotaal.nl`);
        toast({
          title: "Succes!",
          description: `Avatar geüpload voor c.kooij@nrgtotaal.nl`,
        });

        console.log('Upload result:', data);
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        setResult(`❌ Error: ${error.message || "Er is een fout opgetreden"}`);
        toast({
          title: "Error",
          description: error.message || "Er is een fout opgetreden",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    uploadAvatarForCorrie();
  }, [toast]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin: Avatar Upload</h1>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="mb-4">
            <img 
              src={corrieAvatar} 
              alt="Corrie Kooij" 
              className="w-32 h-32 rounded-full object-cover mb-4"
            />
          </div>
          
          <p className="mb-4 text-muted-foreground">
            E-mail: <strong>c.kooij@nrgtotaal.nl</strong>
          </p>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg font-medium">
              {loading ? "⏳ Bezig met uploaden..." : result}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAvatarUpload;
