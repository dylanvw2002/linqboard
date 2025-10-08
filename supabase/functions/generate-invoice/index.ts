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
  const formattedDate = date.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const intervalText = billingInterval === 'monthly' ? 'Maandelijks' : 'Jaarlijks';

  let vatNote = '';
  if (vatRate === 0 && customerType === 'business' && vatNumber) {
    vatNote = '<p style="font-style: italic; color: #666;">BTW verlegd naar klant (reverse charge mechanism)</p>';
  } else if (vatRate === 0 && customerCountry !== 'NL') {
    vatNote = '<p style="font-style: italic; color: #666;">BTW-vrijgesteld (buiten EU)</p>';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factuur ${invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333333;
      background: #F7F8FA;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 3px solid transparent;
      border-image: linear-gradient(135deg, #8B7BE8 0%, #B77CE8 100%);
      border-image-slice: 1;
      padding-bottom: 20px;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 8px 24px -8px rgba(139, 123, 232, 0.15);
    }
    .company-info {
      font-size: 14px;
    }
    .company-info h1 {
      margin: 0 0 15px 0;
      background: linear-gradient(135deg, #8B7BE8 0%, #B77CE8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 28px;
      font-weight: bold;
    }
    .invoice-info {
      text-align: right;
      font-size: 14px;
    }
    .invoice-info h2 {
      margin: 0 0 15px 0;
      font-size: 22px;
      color: #8B7BE8;
      font-weight: bold;
    }
    .customer-info {
      margin: 30px 0;
      padding: 25px;
      background: #F3F1FD;
      border-radius: 12px;
      border-left: 4px solid #8B7BE8;
      box-shadow: 0 4px 12px -4px rgba(139, 123, 232, 0.1);
    }
    .customer-info h3 {
      margin-top: 0;
      background: linear-gradient(135deg, #8B7BE8 0%, #B77CE8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.1);
    }
    th, td {
      padding: 16px;
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
    }
    th {
      background: linear-gradient(135deg, #8B7BE8 0%, #B77CE8 100%);
      color: white;
      font-weight: bold;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    tbody tr:nth-child(even) {
      background: #FAFAFA;
    }
    tbody tr:hover {
      background: #F3F1FD;
    }
    .amount {
      text-align: right;
      font-weight: 500;
    }
    .total-row {
      font-weight: bold;
      font-size: 16px;
      background: linear-gradient(135deg, rgba(139, 123, 232, 0.1) 0%, rgba(183, 124, 232, 0.1) 100%) !important;
      border-top: 2px solid #8B7BE8;
    }
    .footer {
      margin-top: 60px;
      padding: 30px;
      border-top: 3px solid transparent;
      border-image: linear-gradient(135deg, #8B7BE8 0%, #B77CE8 100%);
      border-image-slice: 1;
      font-size: 11px;
      color: #666;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.1);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      margin-bottom: 20px;
    }
    .footer-section {
      text-align: left;
    }
    .footer-section h4 {
      color: #8B7BE8;
      margin: 0 0 10px 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer-section p {
      margin: 5px 0;
      line-height: 1.6;
    }
    .footer-legal {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-style: italic;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>LinqBoard</h1>
      <p>
        Sikkelvoorde 4<br>
        3204 EJ Spijkenisse<br>
        KVK: 97289388<br>
        BTW: NL005260317B10
      </p>
    </div>
    <div class="invoice-info">
      <h2>FACTUUR</h2>
      <p>
        <strong>Factuurnummer:</strong> ${invoiceNumber}<br>
        <strong>Factuurdatum:</strong> ${formattedDate}
      </p>
    </div>
  </div>

  <div class="customer-info">
    <h3>Klantgegevens</h3>
    <p>
      <strong>${customerName}</strong><br>
      ${customerEmail}<br>
      ${customerCountry}
      ${vatNumber ? `<br><strong>BTW-nummer:</strong> ${vatNumber}` : ''}
    </p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Omschrijving</th>
        <th class="amount">Aantal</th>
        <th class="amount">Bedrag excl. BTW</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>LinqBoard ${planName} Abonnement - ${intervalText}</td>
        <td class="amount">1</td>
        <td class="amount">€ ${amountExclVat.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2">Subtotaal excl. BTW</td>
        <td class="amount">€ ${amountExclVat.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2">BTW (${vatRate}%)</td>
        <td class="amount">€ ${vatAmount.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2">Totaal incl. BTW</td>
        <td class="amount">€ ${amountInclVat.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  ${vatNote}

  <div class="footer">
    <div class="footer-grid">
      <div class="footer-section">
        <h4>Betalingsinformatie</h4>
        <p>
          <strong>IBAN:</strong> NL49 KNAB 0776 5216 59<br>
          <strong>T.n.v.:</strong> LinqBoard<br>
          <strong>Betaaltermijn:</strong> 14 dagen
        </p>
      </div>
      <div class="footer-section">
        <h4>Bedrijfsgegevens</h4>
        <p>
          <strong>LinqBoard</strong><br>
          Sikkelvoorde 4<br>
          3204 EJ Spijkenisse<br>
          KVK: 97289388<br>
          BTW: NL005260317B10
        </p>
      </div>
      <div class="footer-section">
        <h4>Contact</h4>
        <p>
          <strong>Email:</strong> info@linqboard.io<br>
          <strong>Website:</strong> www.linqboard.io
        </p>
      </div>
    </div>
    <div class="footer-legal">
      <p>Bedankt voor uw abonnement op LinqBoard</p>
      <p>Deze factuur is automatisch gegenereerd en digitaal geldig zonder handtekening</p>
      <p>Graag betalen binnen 14 dagen onder vermelding van het factuurnummer</p>
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
