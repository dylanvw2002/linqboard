import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OneCent = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Niet ingelogd",
          description: "Je moet ingelogd zijn om een betaling te doen",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Call edge function to create one-time payment
      const { data, error } = await supabase.functions.invoke('create-one-time-payment', {
        body: {
          amount: 0.01,
          description: "Test betaling - 1 cent",
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        // Redirect to Mollie checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Geen checkout URL ontvangen");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Fout bij betaling",
        description: error.message || "Er is iets misgegaan bij het aanmaken van de betaling",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Test Betaling</CardTitle>
          <CardDescription>
            Test de Mollie live API met een betaling van 1 cent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Bedrag:</span>
              <span className="text-2xl font-bold">€0,01</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Beschrijving:</span>
              <span className="text-sm">Test betaling</span>
            </div>
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig met voorbereiden...
              </>
            ) : (
              "Betaal €0,01"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Je wordt doorgestuurd naar de veilige betaalomgeving van Mollie
          </p>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            Terug naar home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OneCent;
