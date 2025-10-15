import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

// Helper function to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    
    // Determine MIME type from URL
    const ext = url.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return ''; // Return empty string on error
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function createWelcomeEmail(userName: string, logoBase64: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welkom bij LinqBoard</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf4 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
              <img src="${logoBase64}" alt="LinqBoard" style="max-width: 180px; height: auto; margin-bottom: 10px;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #1a202c; font-size: 28px; font-weight: bold; margin: 0 0 16px 0; text-align: center;">
                Welkom bij LinqBoard, ${userName}! 🎉
              </h1>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Je account is succesvol aangemaakt. We zijn blij dat je bij ons team komt!
              </p>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Met LinqBoard kun je eenvoudig samenwerken met je team. Hier zijn enkele dingen die je kunt doen:
              </p>
              
              <!-- Features List -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
                            <span style="color: white; font-size: 18px;">📋</span>
                          </div>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="margin: 0; color: #2d3748; font-size: 15px; font-weight: 600;">Maak boards aan</p>
                          <p style="margin: 4px 0 0 0; color: #718096; font-size: 14px;">Organiseer je taken in overzichtelijke boards</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
                            <span style="color: white; font-size: 18px;">👥</span>
                          </div>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="margin: 0; color: #2d3748; font-size: 15px; font-weight: 600;">Nodig teamleden uit</p>
                          <p style="margin: 4px 0 0 0; color: #718096; font-size: 14px;">Werk samen met je organisatie</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
                            <span style="color: white; font-size: 18px;">⚡</span>
                          </div>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="margin: 0; color: #2d3748; font-size: 15px; font-weight: 600;">Werk in realtime</p>
                          <p style="margin: 4px 0 0 0; color: #718096; font-size: 14px;">Zie live updates van je teamleden</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://linqboard.io/dashboard" 
                       style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Ga naar Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Heb je vragen? Neem contact met ons op via <a href="mailto:info@linqboard.io" style="color: #667eea; text-decoration: none;">info@linqboard.io</a>
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
    const { email, userName } = await req.json();
    
    console.log('Sending welcome email to:', email);

    // Convert logo to base64 for embedding
    const logoUrl = 'https://linqboard.lovable.app/logo-transparent.png';
    const logoBase64 = await imageUrlToBase64(logoUrl);

    // Create HTML email
    const html = createWelcomeEmail(userName || 'daar', logoBase64);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'LinqBoard <info@linqboard.io>',
      to: [email],
      subject: 'Welkom bij LinqBoard! 🎉',
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Welcome email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error sending welcome email:', error);
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
