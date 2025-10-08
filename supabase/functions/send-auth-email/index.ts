import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HTML email template function
function createConfirmationEmail(confirmation_url: string, token: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bevestig je LinqBoard account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 12px;">
        <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 0 0 40px 0;">Welkom bij LinqBoard!</h1>
        
        <p style="color: #333; font-size: 14px; line-height: 1.5; margin: 24px 0;">
          Bedankt voor je registratie. Klik op de onderstaande link om je account te bevestigen:
        </p>
        
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
          <tr>
            <td>
              <a href="${confirmation_url}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #2754C5; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 14px;">
                Bevestig je account
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #333; font-size: 14px; line-height: 1.5; margin: 24px 0 14px 0;">
          Of kopieer en plak deze bevestigingscode:
        </p>
        
        <div style="padding: 16px; background-color: #f4f4f4; border-radius: 5px; border: 1px solid #eee;">
          <code style="color: #333; font-size: 14px;">${token}</code>
        </div>
        
        <p style="color: #ababab; font-size: 14px; line-height: 1.5; margin: 24px 0;">
          Als je je niet hebt geregistreerd, kun je deze email negeren.
        </p>
        
        <p style="color: #898989; font-size: 12px; line-height: 1.5; margin: 24px 0;">
          Met vriendelijke groet,<br>
          Het LinqBoard team
        </p>
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

    // Create HTML email
    const html = createConfirmationEmail(confirmation_url, email_data.token);

    // Determine subject based on action type
    let subject = 'Bevestig je LinqBoard account';
    if (email_data.email_action_type === 'recovery' || email_data.email_action_type === 'magiclink') {
      subject = 'Je LinqBoard login link';
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
