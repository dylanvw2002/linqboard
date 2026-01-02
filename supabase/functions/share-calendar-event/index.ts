import { Resend } from 'https://esm.sh/resend@4.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, parseISO, addDays } from 'https://esm.sh/date-fns@3.6.0';
import { nl } from 'https://esm.sh/date-fns@3.6.0/locale';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const ext = url.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  color: string;
}

interface ShareRequest {
  event: CalendarEvent;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  message?: string;
}

function generateICSContent(event: CalendarEvent): string {
  const formatICSDate = (dateStr: string, allDay: boolean) => {
    const date = parseISO(dateStr);
    if (allDay) {
      return format(date, "yyyyMMdd");
    }
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const escapeICS = (text: string) => {
    return text.replace(/[\\;,\n]/g, (match) => {
      if (match === '\n') return '\\n';
      return '\\' + match;
    });
  };

  const uid = `${event.id}@linqboard`;
  const dtstamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  const dtstart = formatICSDate(event.start_time, event.all_day);
  const dtend = event.end_time 
    ? formatICSDate(event.end_time, event.all_day)
    : event.all_day 
      ? formatICSDate(addDays(parseISO(event.start_time), 1).toISOString(), true)
      : formatICSDate(addDays(parseISO(event.start_time), 1).toISOString(), false);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LinqBoard//Calendar//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    event.all_day ? `DTSTART;VALUE=DATE:${dtstart}` : `DTSTART:${dtstart}`,
    event.all_day ? `DTEND;VALUE=DATE:${dtend}` : `DTEND:${dtend}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

function createShareEmail(
  event: CalendarEvent, 
  senderName: string, 
  recipientName: string, 
  message: string | undefined,
  logoBase64: string
): string {
  const eventDate = parseISO(event.start_time);
  const formattedDate = format(eventDate, "EEEE d MMMM yyyy", { locale: nl });
  const formattedTime = event.all_day 
    ? 'Hele dag' 
    : format(eventDate, "HH:mm", { locale: nl }) + (event.end_time ? ` - ${format(parseISO(event.end_time), "HH:mm", { locale: nl })}` : '');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agenda-uitnodiging</title>
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
              <h1 style="color: #1a202c; font-size: 24px; font-weight: bold; margin: 0 0 16px 0; text-align: center;">
                📅 Agenda-uitnodiging
              </h1>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                <strong>${senderName}</strong> nodigt je uit voor een afspraak
              </p>
              
              ${message ? `
              <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #667eea;">
                <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">
                  "${message}"
                </p>
              </div>
              ` : ''}
              
              <!-- Event Details Card -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; margin: 24px 0;">
                <h2 style="color: #ffffff; font-size: 20px; font-weight: bold; margin: 0 0 16px 0;">
                  ${event.title}
                </h2>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="30" valign="top">
                            <span style="color: white; font-size: 16px;">📆</span>
                          </td>
                          <td style="padding-left: 8px;">
                            <p style="margin: 0; color: #ffffff; font-size: 14px;">${formattedDate}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="30" valign="top">
                            <span style="color: white; font-size: 16px;">🕐</span>
                          </td>
                          <td style="padding-left: 8px;">
                            <p style="margin: 0; color: #ffffff; font-size: 14px;">${formattedTime}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ${event.description ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="30" valign="top">
                            <span style="color: white; font-size: 16px;">📝</span>
                          </td>
                          <td style="padding-left: 8px;">
                            <p style="margin: 0; color: #ffffff; font-size: 14px;">${event.description}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
                Download het bijgevoegde .ics bestand om deze afspraak toe te voegen aan je agenda (Google Calendar, Outlook, Apple Calendar, etc.)
              </p>
              
              <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Deze uitnodiging is verstuurd via <a href="https://linqboard.io" style="color: #667eea; text-decoration: none;">LinqBoard</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f7fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="color: #a0aec0; font-size: 12px; margin: 0;">
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
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { event, recipientEmail, recipientName, senderName, message }: ShareRequest = await req.json();
    
    console.log('Sharing calendar event:', { 
      eventTitle: event.title, 
      recipientEmail, 
      senderName 
    });

    // Validate required fields
    if (!event || !recipientEmail || !senderName) {
      throw new Error('Missing required fields: event, recipientEmail, or senderName');
    }

    // Convert logo to base64 for embedding
    const logoUrl = 'https://linqboard.lovable.app/logo-transparent.png';
    const logoBase64 = await imageUrlToBase64(logoUrl);

    // Generate ICS content
    const icsContent = generateICSContent(event);
    const icsBase64 = btoa(icsContent);

    // Create HTML email
    const html = createShareEmail(event, senderName, recipientName || 'daar', message, logoBase64);

    // Format date for subject
    const eventDate = parseISO(event.start_time);
    const formattedSubjectDate = format(eventDate, "d MMM", { locale: nl });

    // Send email via Resend with ICS attachment
    const { data, error } = await resend.emails.send({
      from: 'LinqBoard <info@linqboard.io>',
      to: [recipientEmail],
      subject: `📅 Uitnodiging: ${event.title} - ${formattedSubjectDate}`,
      html,
      attachments: [
        {
          filename: `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
          content: icsBase64,
          contentType: 'text/calendar',
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Calendar event shared successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error sharing calendar event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to share event';
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
