import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Token en nieuw wachtwoord zijn verplicht' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Wachtwoord moet minimaal 6 tekens zijn' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find and validate token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Ongeldige of verlopen reset code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw updateError;
    }

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    console.log('Password reset successful for user:', tokenData.user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wachtwoord succesvol gewijzigd! Je kunt nu inloggen.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reset-password-with-token:', error);
    return new Response(
      JSON.stringify({ error: 'Er ging iets mis. Probeer het later opnieuw.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
