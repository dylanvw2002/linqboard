import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  customerCountry: string;
  customerType: string;
  vatNumber?: string;
  amountExclVat: number;
  vatRate: number;
  vatAmount: number;
  amountInclVat: number;
  plan: string;
  billingInterval: string;
}

function generateInvoiceHTML(data: InvoiceData): string {
  const {
    invoiceNumber,
    invoiceDate,
    customerName,
    customerEmail,
    customerCountry,
    customerType,
    vatNumber,
    amountExclVat,
    vatRate,
    vatAmount,
    amountInclVat,
    plan,
    billingInterval
  } = data;

  const date = new Date(invoiceDate);
  const formattedDate = date.toLocaleDateString('nl-NL');
  const dueDate = new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL');

  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const intervalText = billingInterval === 'monthly' ? 'Maandelijks' : 'Jaarlijks';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factuur ${invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #F7F8FA;
      padding: 40px;
      margin: 0;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 8px 24px -8px rgba(139, 123, 232, 0.15);
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid;
      border-image: linear-gradient(135deg, #8B7BE8 0%, #B77CE8 100%) 1;
      box-shadow: 0 4px 12px -4px rgba(139, 123, 232, 0.1);
    }
    .invoice-logo {
      height: 180px;
      width: auto;
    }
    .company-info {
      text-align: right;
      font-size: 12px;
      line-height: 1.6;
      color: #333333;
    }
    .invoice-info {
      margin-bottom: 30px;
      color: #333333;
    }
    .invoice-info h2 {
      color: #8B7BE8;
      margin: 0 0 15px 0;
      font-size: 22px;
      font-weight: bold;
    }
    .invoice-info p {
      margin: 5px 0;
    }
    .customer-info {
      background: #F3F1FD;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 12px;
      border-left: 4px solid #8B7BE8;
      box-shadow: 0 4px 12px -4px rgba(139, 123, 232, 0.1);
    }
    .customer-info h3 {
      color: #8B7BE8;
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .customer-info p {
      margin: 5px 0;
      line-height: 1.6;
      color: #333333;
    }
    .invoice-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 30px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px -4px rgba(139, 123, 232, 0.1);
    }
    .invoice-table th {
      background: #8B7BE8;
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    .invoice-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e5e7eb;
      color: #333333;
    }
    .invoice-table tr:nth-child(even) {
      background: #F9FAFB;
    }
    .invoice-table tr:last-child td {
      border-bottom: none;
    }
    .total-row {
      background: linear-gradient(135deg, #F3F1FD 0%, #FAF9FE 100%) !important;
      font-weight: bold;
      color: #8B7BE8;
    }
    .invoice-footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #F3F1FD;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      margin-bottom: 20px;
    }
    .footer-section h4 {
      color: #8B7BE8;
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: 600;
    }
    .footer-section p {
      margin: 5px 0;
      font-size: 12px;
      line-height: 1.6;
      color: #333333;
    }
    .legal-text {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
      line-height: 1.6;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div>
        <svg class="invoice-logo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#8B7BE8;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#B77CE8;stop-opacity:1" />
            </linearGradient>
          </defs>
          <text x="100" y="100" font-family="Arial" font-size="48" font-weight="bold" fill="url(#logoGradient)" text-anchor="middle" dominant-baseline="middle">LinqBoard</text>
        </svg>
      </div>
      <div class="company-info">
        <strong>LinqBoard</strong><br>
        Sikkelvoorde 4<br>
        3204 EJ Spijkenisse<br>
        Nederland<br>
        <br>
        KVK: 97289388<br>
        BTW: NL005260317B10
      </div>
    </div>

    <div class="invoice-info">
      <h2>FACTUUR</h2>
      <p><strong>Factuurnummer:</strong> ${invoiceNumber}</p>
      <p><strong>Factuurdatum:</strong> ${formattedDate}</p>
      <p><strong>Vervaldatum:</strong> ${dueDate}</p>
    </div>

    <div class="customer-info">
      <h3>Factuur aan:</h3>
      <p>
        <strong>${customerName}</strong><br>
        ${customerEmail}<br>
        ${customerCountry}
        ${vatNumber ? `<br><strong>BTW-nummer:</strong> ${vatNumber}` : ''}
      </p>
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>Omschrijving</th>
          <th class="text-center">Aantal</th>
          <th class="text-right">Prijs</th>
          <th class="text-right">BTW</th>
          <th class="text-right">Totaal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>LinqBoard ${planName} Abonnement - ${intervalText}</td>
          <td class="text-center">1</td>
          <td class="text-right">€${amountExclVat.toFixed(2)}</td>
          <td class="text-right">€${vatAmount.toFixed(2)}</td>
          <td class="text-right">€${amountInclVat.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" class="text-right"><strong>Totaal te betalen</strong></td>
          <td class="text-right"><strong>€${amountInclVat.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="invoice-footer">
      <div class="footer-grid">
        <div class="footer-section">
          <h4>Betalingsinformatie</h4>
          <p><strong>IBAN:</strong> NL49 KNAB 0776 5216 59</p>
          <p><strong>Ten name van:</strong> LinqBoard</p>
          <p><strong>Betaaltermijn:</strong> 14 dagen</p>
          <p style="margin-top: 10px; color: #8B7BE8;">
            <strong>Gelieve bij betaling het factuurnummer te vermelden</strong>
          </p>
        </div>
        
        <div class="footer-section">
          <h4>Bedrijfsgegevens</h4>
          <p><strong>LinqBoard</strong></p>
          <p>Sikkelvoorde 4</p>
          <p>3204 EJ Spijkenisse</p>
          <p>Nederland</p>
          <p style="margin-top: 10px;">
            <strong>KVK:</strong> 97289388<br>
            <strong>BTW:</strong> NL005260317B10
          </p>
        </div>
        
        <div class="footer-section">
          <h4>Contact</h4>
          <p><strong>Email:</strong> info@linqboard.io</p>
          <p><strong>Website:</strong> www.linqboard.io</p>
          <p style="margin-top: 15px; color: #8B7BE8;">
            <strong>Vragen?</strong><br>
            Neem gerust contact met ons op
          </p>
        </div>
      </div>
      
      <div class="legal-text">
        <p><strong>Deze factuur is automatisch gegenereerd en digitaal geldig</strong></p>
        <p>Graag betalen binnen 14 dagen onder vermelding van het factuurnummer</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoiceId } = await req.json();

    console.log('Generating invoice PDF for:', invoiceId);

    // Get invoice data
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Get user profile for name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', invoice.user_id)
      .single();

    // Generate HTML
    const html = generateInvoiceHTML({
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      customerName: profile?.full_name || invoice.customer_name,
      customerEmail: invoice.customer_email,
      customerCountry: invoice.customer_country,
      customerType: invoice.customer_type,
      vatNumber: invoice.vat_number,
      amountExclVat: parseFloat(invoice.amount_excl_vat),
      vatRate: parseFloat(invoice.vat_rate),
      vatAmount: parseFloat(invoice.vat_amount),
      amountInclVat: parseFloat(invoice.amount_incl_vat),
      plan: invoice.customer_type,
      billingInterval: 'monthly'
    });

    // For now, return HTML (in production, you'd convert to PDF)
    // You could use a service like PDFShift or Puppeteer
    return new Response(
      JSON.stringify({ 
        success: true,
        html,
        message: 'Invoice generated (HTML format)'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating invoice:', error);
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
