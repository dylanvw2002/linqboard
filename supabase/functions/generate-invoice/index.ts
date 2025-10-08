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
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 20px;
    }
    .company-info {
      font-size: 14px;
    }
    .company-info h1 {
      margin: 0 0 10px 0;
      color: #0066cc;
      font-size: 24px;
    }
    .invoice-info {
      text-align: right;
      font-size: 14px;
    }
    .invoice-info h2 {
      margin: 0 0 10px 0;
      font-size: 20px;
      color: #0066cc;
    }
    .customer-info {
      margin: 30px 0;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 5px;
    }
    .customer-info h3 {
      margin-top: 0;
      color: #0066cc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #0066cc;
      color: white;
      font-weight: bold;
    }
    .amount {
      text-align: right;
    }
    .total-row {
      font-weight: bold;
      font-size: 16px;
      background: #f0f0f0;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>LinqBoard</h1>
      <p>
        NRG Totaal B.V.<br>
        Adres<br>
        Postcode Plaats<br>
        BTW-nummer: NL123456789B01
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
    <p>Bedankt voor uw abonnement op LinqBoard</p>
    <p>Deze factuur is automatisch gegenereerd en digitaal geldig zonder handtekening</p>
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
