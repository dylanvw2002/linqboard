import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateResetToken(): string {
  // Generate a secure 6-character token
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function createPasswordResetEmail(resetUrl: string, token: string, userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset je LinqBoard wachtwoord</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f4ff 0%, #e8ecf9 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 60px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header with Logo and Brand -->
          <tr>
            <td style="padding: 50px 40px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 20px 30px; border-radius: 16px; backdrop-filter: blur(10px);">
                <img src="https://linqboard.io/logo-linqboard.png" alt="LinqBoard" style="max-width: 120px; height: auto; display: block;">
              </div>
              <h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 24px 0 0 0; letter-spacing: 0.5px;">
                Wachtwoord Herstel
              </h2>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%); border-radius: 50%; line-height: 80px; margin-bottom: 24px;">
                  <span style="font-size: 40px; vertical-align: middle;">🔐</span>
                </div>
                <h1 style="color: #1a202c; font-size: 32px; font-weight: bold; margin: 0 0 12px 0;">
                  Hallo ${userName}!
                </h1>
                <p style="color: #718096; font-size: 16px; line-height: 1.6; margin: 0;">
                  Geen zorgen, dit overkomt de beste! 
                </p>
              </div>
              
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #667eea;">
                <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0;">
                  We hebben een verzoek ontvangen om je LinqBoard wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord in te stellen en weer toegang te krijgen tot je boards.
                </p>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; font-size: 17px; font-weight: 600; border-radius: 12px; box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);">
                      Wachtwoord Resetten →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%); margin: 40px 0;"></div>
              
              <!-- Validity Notice -->
              <div style="text-align: center;">
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 8px;">
                  <p style="color: #856404; font-size: 14px; margin: 0;">
                    <span style="font-size: 18px; margin-right: 8px;">⏱️</span>
                    <strong>Let op:</strong>&nbsp;Deze link is 1 uur geldig
                  </p>
                </div>
              </div>
              
              <!-- Security Notice -->
              <div style="margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border: 1px solid #bae6fd;">
                <p style="color: #075985; font-size: 13px; line-height: 1.7; margin: 0; text-align: center;">
                  <strong>🛡️ Beveiligingstip:</strong> Als je dit verzoek niet hebt gedaan, kun je deze email veilig negeren. Je wachtwoord blijft ongewijzigd en je account is veilig.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                Met vriendelijke groet,<br>
                <strong style="color: #2d3748; font-size: 15px;">Het LinqBoard Team</strong>
              </p>
              <div style="margin: 24px 0; height: 1px; background: linear-gradient(90deg, transparent 0%, #cbd5e0 50%, transparent 100%);"></div>
              <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                © 2025 LinqBoard
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Email Footer Note -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin-top: 24px;">
          <tr>
            <td style="padding: 0 40px; text-align: center;">
              <p style="color: #a0aec0; font-size: 12px; line-height: 1.6; margin: 0;">
                Deze email is automatisch verstuurd. Reageren op deze email is niet mogelijk.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      throw userError;
    }

    const user = userData.users.find(u => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: 'Als het email adres bestaat, is er een reset link verstuurd.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user name from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    const userName = profile?.full_name || 'daar';

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Store token in database
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Error storing reset token:', insertError);
      throw insertError;
    }

    // Create reset URL
    const resetUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://linqboard.io'}/reset-password?token=${token}`;

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'LinqBoard <info@linqboard.io>',
      to: [email],
      subject: 'Reset je LinqBoard wachtwoord',
      html: createPasswordResetEmail(resetUrl, token, userName),
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Password reset email sent to:', email);

    // Cleanup old tokens
    await supabaseAdmin.rpc('cleanup_expired_reset_tokens');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reset link is verstuurd naar je email adres.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in request-password-reset:', error);
    return new Response(
      JSON.stringify({ error: 'Er ging iets mis. Probeer het later opnieuw.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
