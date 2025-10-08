import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

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

function generateInvoicePDF(data: InvoiceData): string {
  const doc = new jsPDF();
  
  // Header with gradient effect (simulated with rectangle)
  doc.setFillColor(139, 123, 232);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Logo image
  const logoUrl = 'https://jfdpljhkrcuietevzshr.supabase.co/storage/v1/object/public/avatars/logo-transparent.png';
  try {
    doc.addImage(logoUrl, 'PNG', 15, 10, 40, 20);
  } catch (error) {
    // Fallback to text if image fails
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('LinqBoard', 20, 28);
  }
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Invoice title and number
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTUUR', 150, 28);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.invoice_number, 150, 36);
  
  const invoiceDate = new Date(data.invoice_date).toLocaleDateString('nl-NL');
  doc.text(`Datum: ${invoiceDate}`, 150, 42);
  
  // From section
  let yPos = 60;
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.setFont('helvetica', 'bold');
  doc.text('VAN', 20, yPos);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text('LinqBoard B.V.', 20, yPos);
  yPos += 5;
  doc.text('Voorbeeldstraat 123', 20, yPos);
  yPos += 5;
  doc.text('1234 AB Amsterdam', 20, yPos);
  yPos += 5;
  doc.text('Nederland', 20, yPos);
  yPos += 5;
  doc.text('BTW: NL123456789B01', 20, yPos);
  
  // To section
  yPos += 15;
  doc.setTextColor(102, 102, 102);
  doc.setFont('helvetica', 'bold');
  doc.text('AAN', 20, yPos);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(data.customer_name, 20, yPos);
  yPos += 5;
  doc.text(data.customer_email, 20, yPos);
  yPos += 5;
  doc.text(data.customer_country, 20, yPos);
  if (data.vat_number) {
    yPos += 5;
    doc.text(`BTW-nummer: ${data.vat_number}`, 20, yPos);
  }
  
  // Table
  yPos += 15;
  
  // Table header
  doc.setFillColor(139, 123, 232);
  doc.rect(20, yPos, 170, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Omschrijving', 25, yPos + 7);
  doc.text('Bedrag', 155, yPos + 7);
  
  yPos += 10;
  
  // Table rows
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Line items
  yPos += 8;
  doc.text('LinqBoard Abonnement', 25, yPos);
  doc.text(`€${data.amount_excl_vat.toFixed(2)}`, 155, yPos);
  
  yPos += 8;
  doc.text(`BTW (${data.vat_rate}%)`, 25, yPos);
  doc.text(`€${data.vat_amount.toFixed(2)}`, 155, yPos);
  
  // Divider line
  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);
  
  // Total
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Totaal', 25, yPos);
  doc.text(`€${data.amount_incl_vat.toFixed(2)}`, 155, yPos);
  
  // Footer
  yPos = 270;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 102, 102);
  doc.text('Bedankt voor uw betaling!', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text('LinqBoard B.V. | KvK: 12345678 | IBAN: NL99BANK0123456789', 105, yPos, { align: 'center' });
  
  // Return base64 PDF
  return doc.output('datauristring').split(',')[1];
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

    // Create email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B7BE8, #6E59D9); padding: 30px; text-align: center;">
          <img src="https://jfdpljhkrcuietevzshr.supabase.co/storage/v1/object/public/avatars/logo-transparent.png" alt="LinqBoard" style="height: 60px; width: auto;" />
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
            Je factuur vind je als bijlage bij deze email. Je kunt de factuur ook altijd terugvinden in je <a href="https://linqboard.io/invoices" style="color: #8B7BE8;">factuuroverzicht</a>.
          </p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://linqboard.io/dashboard"
               style="background: #8B7BE8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Naar Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>LinqBoard B.V. | KvK: 12345678 | BTW: NL123456789B01</p>
          <p>Voor vragen kun je contact opnemen via info@linqboard.io</p>
        </div>
      </div>
    `;

    // Generate PDF
    const pdfBase64 = generateInvoicePDF(invoice);
    
    // Send email with PDF attachment
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'LinqBoard <info@linqboard.io>',
      to: [userEmail],
      subject: `Factuur ${invoice.invoice_number} - LinqBoard`,
      html: emailHtml,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: pdfBase64,
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
