import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// EU Countries
const EU_COUNTRIES = [
  { code: 'AT', name: 'Oostenrijk' },
  { code: 'BE', name: 'België' },
  { code: 'BG', name: 'Bulgarije' },
  { code: 'HR', name: 'Kroatië' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Tsjechië' },
  { code: 'DK', name: 'Denemarken' },
  { code: 'EE', name: 'Estland' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'Frankrijk' },
  { code: 'DE', name: 'Duitsland' },
  { code: 'GR', name: 'Griekenland' },
  { code: 'HU', name: 'Hongarije' },
  { code: 'IE', name: 'Ierland' },
  { code: 'IT', name: 'Italië' },
  { code: 'LV', name: 'Letland' },
  { code: 'LT', name: 'Litouwen' },
  { code: 'LU', name: 'Luxemburg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Nederland' },
  { code: 'PL', name: 'Polen' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Roemenië' },
  { code: 'SK', name: 'Slowakije' },
  { code: 'SI', name: 'Slovenië' },
  { code: 'ES', name: 'Spanje' },
  { code: 'SE', name: 'Zweden' }
];

const ALL_COUNTRIES = [
  ...EU_COUNTRIES,
  { code: 'US', name: 'Verenigde Staten' },
  { code: 'GB', name: 'Verenigd Koninkrijk' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australië' },
  { code: 'OTHER', name: 'Overig (buiten EU)' }
].sort((a, b) => a.name.localeCompare(b.name));

const PRICING = {
  pro: { monthly: 7.99, yearly: 79.90 },
  team: { monthly: 19.99, yearly: 199.00 },
  business: { monthly: 39.00, yearly: 390.00 }
};

interface VatCalculation {
  amountExclVat: number;
  vatRate: number;
  vatAmount: number;
  amountInclVat: number;
  vatRule: string;
  description: string;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const plan = searchParams.get('plan') as keyof typeof PRICING || 'pro';
  const billingInterval = searchParams.get('interval') as 'monthly' | 'yearly' || 'monthly';
  
  const [country, setCountry] = useState('NL');
  const [customerType, setCustomerType] = useState<'private' | 'business'>('private');
  const [vatNumber, setVatNumber] = useState('');
  const [vatNumberValid, setVatNumberValid] = useState<boolean | null>(null);
  const [validatingVat, setValidatingVat] = useState(false);
  const [vatCalculation, setVatCalculation] = useState<VatCalculation | null>(null);
  const [calculatingVat, setCalculatingVat] = useState(false);
  const [loading, setLoading] = useState(false);

  const basePrice = PRICING[plan][billingInterval];

  // Calculate VAT when country or customer type changes
  useEffect(() => {
    calculateVat();
  }, [country, customerType, vatNumberValid]);

  const calculateVat = async () => {
    setCalculatingVat(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-vat', {
        body: {
          amountExclVat: basePrice,
          country: country,
          customerType: customerType,
          vatNumberValid: customerType === 'business' ? vatNumberValid : false
        }
      });

      if (error) throw error;
      setVatCalculation(data);
    } catch (error) {
      console.error('VAT calculation error:', error);
      toast.error('Fout bij BTW-berekening');
    } finally {
      setCalculatingVat(false);
    }
  };

  const validateVatNumber = async () => {
    if (!vatNumber || customerType !== 'business') return;
    
    setValidatingVat(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-vat-number', {
        body: {
          vatNumber: vatNumber,
          countryCode: country
        }
      });

      if (error) throw error;
      
      setVatNumberValid(data.valid);
      if (data.valid) {
        toast.success('BTW-nummer gevalideerd');
      } else {
        toast.error('Ongeldig BTW-nummer');
      }
    } catch (error) {
      console.error('VAT validation error:', error);
      toast.error('Fout bij valideren BTW-nummer');
      setVatNumberValid(false);
    } finally {
      setValidatingVat(false);
    }
  };

  const handleCheckout = async () => {
    if (customerType === 'business' && vatNumber && vatNumberValid === null) {
      toast.error('Valideer eerst je BTW-nummer');
      return;
    }

    if (!vatCalculation) {
      toast.error('BTW-berekening ontbreekt');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Niet ingelogd');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-mollie-subscription', {
        body: {
          plan,
          billing_interval: billingInterval,
          country,
          customer_type: customerType,
          vat_number: vatNumber || null,
          vat_number_valid: vatNumberValid || false,
          amount_excl_vat: vatCalculation.amountExclVat,
          vat_rate: vatCalculation.vatRate,
          vat_amount: vatCalculation.vatAmount,
          amount_incl_vat: vatCalculation.amountInclVat
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Fout bij afrekenen');
    } finally {
      setLoading(false);
    }
  };

  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const intervalText = billingInterval === 'monthly' ? 'per maand' : 'per jaar';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate('/pricing')}
          className="mb-6"
        >
          ← Terug naar abonnementen
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Gegevens</CardTitle>
              <CardDescription>Vul je gegevens in voor de factuur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Land</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Klanttype</Label>
                <RadioGroup value={customerType} onValueChange={(v) => setCustomerType(v as 'private' | 'business')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="font-normal">Particulier</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business" className="font-normal">Zakelijk</Label>
                  </div>
                </RadioGroup>
              </div>

              {customerType === 'business' && (
                <div className="space-y-2">
                  <Label htmlFor="vat">BTW-nummer (optioneel)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="vat"
                      placeholder="NL123456789B01"
                      value={vatNumber}
                      onChange={(e) => {
                        setVatNumber(e.target.value);
                        setVatNumberValid(null);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateVatNumber}
                      disabled={!vatNumber || validatingVat}
                    >
                      {validatingVat ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valideer'}
                    </Button>
                  </div>
                  {vatNumberValid === true && (
                    <Alert className="border-green-500">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription>BTW-nummer geldig</AlertDescription>
                    </Alert>
                  )}
                  {vatNumberValid === false && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Ongeldig BTW-nummer</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Overzicht</CardTitle>
              <CardDescription>Jouw bestelling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">LinqBoard {planName}</h3>
                <p className="text-sm text-muted-foreground">{intervalText}</p>
              </div>

              {calculatingVat ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  BTW berekenen...
                </div>
              ) : vatCalculation && (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Excl. BTW</span>
                      <span>€ {vatCalculation.amountExclVat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>BTW ({vatCalculation.vatRate}%)</span>
                      <span>€ {vatCalculation.vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Totaal</span>
                      <span>€ {vatCalculation.amountInclVat.toFixed(2)}</span>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription className="text-xs">
                      {vatCalculation.description}
                    </AlertDescription>
                  </Alert>
                </>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={loading || !vatCalculation}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Naar betaling
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Je wordt doorgeleid naar Mollie voor veilige betaling
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
