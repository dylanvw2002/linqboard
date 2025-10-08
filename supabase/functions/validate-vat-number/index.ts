import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    const { vatNumber, countryCode } = await req.json();

    console.log('Validating VAT number:', { vatNumber, countryCode });

    // Clean VAT number (remove spaces, dashes)
    const cleanVat = vatNumber.replace(/[\s-]/g, '').toUpperCase();

    // VIES API validation
    const viesUrl = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${cleanVat}`;
    
    try {
      const viesResponse = await fetch(viesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!viesResponse.ok) {
        console.log('VIES API error:', viesResponse.status);
        return new Response(
          JSON.stringify({ 
            valid: false,
            error: 'Unable to validate VAT number'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      const viesData = await viesResponse.json();
      
      console.log('VIES response:', viesData);

      return new Response(
        JSON.stringify({ 
          valid: viesData.valid === true,
          name: viesData.name || '',
          address: viesData.address || ''
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (viesError) {
      console.error('VIES API error:', viesError);
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'VIES API temporarily unavailable'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

  } catch (error) {
    console.error('Error validating VAT number:', error);
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
