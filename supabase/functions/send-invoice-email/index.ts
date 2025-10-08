import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_email: string;
  customer_country: string;
  customer_type: string;
  vat_number?: string;
  amount_excl_vat: number;
  vat_rate: number;
  vat_amount: number;
  amount_incl_vat: number;
}

function generateInvoiceHTML(data: InvoiceData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #8B7BE8;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #8B7BE8;
    }
    .invoice-details {
      text-align: right;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #8B7BE8;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .total-row {
      font-weight: bold;
      background: #f9f9f9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo">LinqBoard</div>
      <div class="invoice-details">
        <h1>FACTUUR</h1>
        <p><strong>${data.invoice_number}</strong></p>
        <p>Datum: ${new Date(data.invoice_date).toLocaleDateString('nl-NL')}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Van</div>
      <p><strong>LinqBoard B.V.</strong><br>
      Voorbeeldstraat 123<br>
      1234 AB Amsterdam<br>
      Nederland<br>
      BTW: NL123456789B01</p>
    </div>

    <div class="section">
      <div class="section-title">Aan</div>
      <p><strong>${data.customer_name}</strong><br>
      ${data.customer_email}<br>
      ${data.customer_country}
      ${data.vat_number ? `<br>BTW-nummer: ${data.vat_number}` : ''}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Omschrijving</th>
          <th style="text-align: right;">Bedrag</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>LinqBoard Abonnement</td>
          <td style="text-align: right;">€${data.amount_excl_vat.toFixed(2)}</td>
        </tr>
        <tr>
          <td>BTW (${data.vat_rate}%)</td>
          <td style="text-align: right;">€${data.vat_amount.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td><strong>Totaal</strong></td>
          <td style="text-align: right;"><strong>€${data.amount_incl_vat.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>Bedankt voor uw betaling!</p>
      <p>LinqBoard B.V. | KvK: 12345678 | IBAN: NL99BANK0123456789</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { invoiceId, userEmail, userName } = await req.json();

    console.log('Sending invoice email for:', { invoiceId, userEmail, userName });

    // Fetch invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceError?.message}`);
    }

    // Generate HTML
    const htmlContent = generateInvoiceHTML(invoice);

    // Create email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B7BE8, #6E59D9); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">LinqBoard</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333;">Hallo ${userName},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Bedankt voor je betaling! Hierbij ontvang je de factuur voor je LinqBoard abonnement.
          </p>
          
          <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #8B7BE8;">Factuurgegevens</h3>
            <p style="margin: 5px 0;"><strong>Factuurnummer:</strong> ${invoice.invoice_number}</p>
            <p style="margin: 5px 0;"><strong>Datum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</p>
            <p style="margin: 5px 0;"><strong>Bedrag:</strong> €${invoice.amount_incl_vat.toFixed(2)}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Je factuur vind je als bijlage bij deze email. Je kunt de factuur ook altijd terugvinden in je <a href="https://linqboard.lovable.app/invoices" style="color: #8B7BE8;">factuuroverzicht</a>.
          </p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://linqboard.lovable.app/dashboard"
               style="background: #8B7BE8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Naar Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>LinqBoard B.V. | KvK: 12345678 | BTW: NL123456789B01</p>
          <p>Voor vragen kun je contact opnemen via info@linqboard.nl</p>
        </div>
      </div>
    `;

    // Send email with HTML attachment
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'LinqBoard <noreply@linqboard.nl>',
      to: [userEmail],
      subject: `Factuur ${invoice.invoice_number} - LinqBoard`,
      html: emailHtml,
      attachments: [
        {
          filename: `${invoice.invoice_number}.html`,
          content: btoa(htmlContent),
        },
      ],
    });

    if (emailError || !emailData) {
      throw new Error(`Email send failed: ${emailError?.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully:', emailData);

    // Update invoice with email status
    await supabase
      .from('invoices')
      .update({ 
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-invoice-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
