import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface UpdateNotificationRequest {
  title: string;
  intro: string;
  features: Feature[];
  improvements: string[];
}

async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const mimeType = response.headers.get('content-type') || 'image/png';
  return `data:${mimeType};base64,${base64}`;
}

function createUpdateEmail(
  userName: string,
  title: string,
  intro: string,
  features: Feature[],
  improvements: string[],
  logoBase64: string
): string {
  const featuresHtml = features.map(f => `
    <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border-left: 4px solid #6366f1;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 24px; line-height: 1;">${f.icon}</span>
        <div>
          <h3 style="margin: 0 0 4px 0; color: #1e293b; font-size: 16px; font-weight: 600;">${f.title}</h3>
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">${f.description}</p>
        </div>
      </div>
    </div>
  `).join('');

  const improvementsHtml = improvements.map(i => `
    <li style="margin-bottom: 8px; color: #475569; font-size: 14px; line-height: 1.6;">
      <span style="color: #10b981; margin-right: 8px;">•</span>${i}
    </li>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 40px 40px 30px 40px; text-align: center;">
                  <img src="${logoBase64}" alt="LinqBoard" style="height: 50px; margin-bottom: 20px;" />
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${title}
                  </h1>
                </td>
              </tr>

              <!-- Main content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                    Hoi ${userName || 'daar'}! 👋
                  </p>
                  
                  <p style="margin: 0 0 32px 0; color: #475569; font-size: 15px; line-height: 1.7;">
                    ${intro}
                  </p>

                  <!-- Features section -->
                  <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                    ✨ Nieuwe Features
                  </h2>
                  
                  ${featuresHtml}

                  ${improvements.length > 0 ? `
                  <!-- Improvements section -->
                  <h2 style="margin: 32px 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                    🔧 Andere Verbeteringen
                  </h2>
                  
                  <ul style="margin: 0; padding: 0; list-style: none;">
                    ${improvementsHtml}
                  </ul>
                  ` : ''}

                  <!-- CTA Button -->
                  <div style="margin-top: 40px; text-align: center;">
                    <a href="https://linqboard.lovable.app/dashboard" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
                      Probeer het nu →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-align: center;">
                    Vragen of feedback? Neem contact met ons op!
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} LinqBoard. Alle rechten voorbehouden.
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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { title, intro, features, improvements }: UpdateNotificationRequest = await req.json();

    if (!title || !intro || !features) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, intro, features" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all users
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const users = usersData.users;
    console.log(`Found ${users.length} users to notify`);

    // Get logo as base64
    const logoUrl = "https://jfdpljhkrcuietevzshr.supabase.co/storage/v1/object/public/avatars/linqboard-logo-new.png";
    let logoBase64: string;
    try {
      logoBase64 = await imageUrlToBase64(logoUrl);
    } catch (e) {
      console.error("Failed to convert logo:", e);
      logoBase64 = "";
    }

    // Get user profiles for names
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name");

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

    // Send emails
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const user of users) {
      if (!user.email) continue;

      const userName = profileMap.get(user.id) || user.email.split("@")[0];

      try {
        const emailHtml = createUpdateEmail(
          userName,
          title,
          intro,
          features,
          improvements || [],
          logoBase64
        );

        await resend.emails.send({
          from: "LinqBoard <updates@linqboard.nl>",
          to: [user.email],
          subject: `🆕 ${title}`,
          html: emailHtml,
        });

        console.log(`Email sent to ${user.email}`);
        results.push({ email: user.email, success: true });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (emailError: any) {
        console.error(`Failed to send to ${user.email}:`, emailError);
        results.push({ email: user.email, success: false, error: emailError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Update notification sent to ${successCount} users (${failCount} failed)`,
        details: results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-update-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
