import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Password Reset Email Template
function createPasswordResetEmail(resetUrl: string, token: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset je LinqBoard wachtwoord</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf4 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
              <img src="https://linqboard.lovable.app/logo-transparent.png" alt="LinqBoard" style="max-width: 180px; height: auto; margin-bottom: 10px;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #1a202c; font-size: 28px; font-weight: bold; margin: 0 0 16px 0; text-align: center;">
                Wachtwoord resetten 🔐
              </h1>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                We hebben een verzoek ontvangen om je LinqBoard wachtwoord te resetten.
              </p>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Klik op de onderstaande knop om een nieuw wachtwoord in te stellen:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Wachtwoord Resetten
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="border-top: 1px solid #e2e8f0; margin: 32px 0;"></div>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                Of kopieer en plak deze bevestigingscode:
              </p>
              
              <div style="padding: 16px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <code style="color: #2d3748; font-size: 18px; font-weight: 600; letter-spacing: 2px;">${token}</code>
              </div>
              
              <p style="color: #ed8936; font-size: 14px; text-align: center; margin: 24px 0; font-weight: 500;">
                ⚠️ Deze link is 1 uur geldig
              </p>
              
              <p style="color: #a0aec0; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Als je dit verzoek niet hebt gedaan, kun je deze email veilig negeren. Je wachtwoord blijft ongewijzigd.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f7fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                Met vriendelijke groet,<br>
                <strong style="color: #4a5568;">Het LinqBoard Team</strong>
              </p>
              <p style="color: #a0aec0; font-size: 12px; margin: 16px 0 0 0;">
                © 2025 LinqBoard. Samenwerken zonder gedoe.
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

// Email Confirmation Template
function createConfirmationEmail(confirmationUrl: string, token: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bevestig je LinqBoard account</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf4 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
              <img src="https://linqboard.lovable.app/logo-transparent.png" alt="LinqBoard" style="max-width: 180px; height: auto; margin-bottom: 10px;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #1a202c; font-size: 28px; font-weight: bold; margin: 0 0 16px 0; text-align: center;">
                Welkom bij LinqBoard! 🎉
              </h1>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
                Bedankt voor je registratie. We zijn blij dat je bij ons team komt!
              </p>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Klik op de onderstaande knop om je account te bevestigen en aan de slag te gaan:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}" 
                       style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Bevestig Account
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="border-top: 1px solid #e2e8f0; margin: 32px 0;"></div>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                Of kopieer en plak deze bevestigingscode:
              </p>
              
              <div style="padding: 16px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <code style="color: #2d3748; font-size: 18px; font-weight: 600; letter-spacing: 2px;">${token}</code>
              </div>
              
              <p style="color: #a0aec0; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Als je je niet hebt geregistreerd, kun je deze email veilig negeren.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f7fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                Met vriendelijke groet,<br>
                <strong style="color: #4a5568;">Het LinqBoard Team</strong>
              </p>
              <p style="color: #a0aec0; font-size: 12px; margin: 16px 0 0 0;">
                © 2025 LinqBoard. Samenwerken zonder gedoe.
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 });
  }

  try {
    const payload = await req.json();
    
    const {
      user,
      email_data,
    } = payload as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    console.log('Processing auth email:', {
      email: user.email,
      action_type: email_data.email_action_type,
    });

    // Build confirmation URL
    const supabase_url = Deno.env.get('SUPABASE_URL') ?? email_data.site_url;
    const confirmation_url = `${supabase_url}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;

    // Determine email type and create appropriate HTML
    let html: string;
    let subject: string;

    if (email_data.email_action_type === 'recovery') {
      // Password reset email
      subject = 'Reset je LinqBoard wachtwoord';
      html = createPasswordResetEmail(confirmation_url, email_data.token);
    } else if (email_data.email_action_type === 'magiclink') {
      // Magic link email
      subject = 'Je LinqBoard login link';
      html = createConfirmationEmail(confirmation_url, email_data.token);
    } else {
      // Default: email confirmation
      subject = 'Bevestig je LinqBoard account';
      html = createConfirmationEmail(confirmation_url, email_data.token);
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'LinqBoard <info@linqboard.io>',
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error sending auth email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return new Response(
      JSON.stringify({
        error: {
          message: errorMessage,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
