import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// EU country codes
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

interface VatCalculationRequest {
  amountExclVat: number;
  country: string;
  customerType: 'private' | 'business';
  vatNumberValid?: boolean;
}

interface VatCalculationResponse {
  amountExclVat: number;
  vatRate: number;
  vatAmount: number;
  amountInclVat: number;
  vatRule: string;
  description: string;
}

function calculateVat(params: VatCalculationRequest): VatCalculationResponse {
  const { amountExclVat, country, customerType, vatNumberValid } = params;
  
  let vatRate = 0;
  let vatRule = '';
  let description = '';

  // Netherlands
  if (country === 'NL') {
    vatRate = 21;
    vatRule = 'NL_STANDARD';
    description = 'Nederlandse BTW 21%';
  }
  // EU Business with valid VAT number (reverse charge)
  else if (EU_COUNTRIES.includes(country) && customerType === 'business' && vatNumberValid) {
    vatRate = 0;
    vatRule = 'EU_B2B_REVERSE_CHARGE';
    description = 'BTW verlegd naar klant (reverse charge)';
  }
  // EU Private customer
  else if (EU_COUNTRIES.includes(country) && customerType === 'private') {
    vatRate = 21;
    vatRule = 'EU_B2C_NL_RATE';
    description = 'EU particulier - Nederlandse BTW 21% (tot €10.000/jaar)';
  }
  // EU Business without valid VAT number (treat as private)
  else if (EU_COUNTRIES.includes(country) && customerType === 'business' && !vatNumberValid) {
    vatRate = 21;
    vatRule = 'EU_B2B_NO_VAT';
    description = 'EU zakelijk zonder geldig BTW-nummer - Nederlandse BTW 21%';
  }
  // Outside EU
  else {
    vatRate = 0;
    vatRule = 'NON_EU_EXEMPT';
    description = 'BTW-vrijgesteld (buiten EU)';
  }

  const vatAmount = Number((amountExclVat * vatRate / 100).toFixed(2));
  const amountInclVat = Number((amountExclVat + vatAmount).toFixed(2));

  return {
    amountExclVat: Number(amountExclVat.toFixed(2)),
    vatRate,
    vatAmount,
    amountInclVat,
    vatRule,
    description
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check rate limit (10 requests per minute for VAT calculations)
    const { data: rateLimitCheck } = await supabaseClient.rpc('check_rate_limit', {
      _user_id: user.id,
      _operation: 'calculate_vat',
      _max_requests: 10,
      _time_window_seconds: 60
    });

    if (rateLimitCheck === false) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a minute.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        }
      );
    }

    // Log the request
    await supabaseClient.rpc('log_rate_limit_request', {
      _operation: 'calculate_vat'
    });

    const calculationParams: VatCalculationRequest = await req.json();

    console.log('Calculating VAT:', calculationParams);

    const result = calculateVat(calculationParams);

    console.log('VAT calculation result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error calculating VAT:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
