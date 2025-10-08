import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImage from "@/assets/logo-transparent.png";

const InvoicePreview = () => {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('nl-NL');
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL');

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Factuursjabloon Preview</h1>
        </div>
        
        {/* Invoice Preview */}
        <div className="invoice-preview-container">
          <style dangerouslySetInnerHTML={{ __html: `
            .invoice-preview-container {
              font-family: Arial, sans-serif;
              background: #F7F8FA;
              padding: 40px;
              border-radius: 8px;
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
            .invoice-header h1 {
              display: flex;
              align-items: center;
              gap: 12px;
              margin: 0;
              font-size: 28px;
              font-weight: bold;
              background: linear-gradient(135deg, #8B7BE8 0%, #B77CE8 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .invoice-logo {
              height: 150px;
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
              background: linear-gradient(135deg, #8B7BE8 0%, #B77CE8 100%);
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
          `}} />
          
          <div className="invoice-container">
            <div className="invoice-header">
              <div>
                <h1>
                  <img src={logoImage} alt="LinqBoard" className="invoice-logo" />
                </h1>
              </div>
              <div className="company-info">
                <strong>LinqBoard</strong><br />
                Sikkelvoorde 4<br />
                3204 EJ Spijkenisse<br />
                Nederland<br />
                <br />
                KVK: 97289388<br />
                BTW: NL005260317B10
              </div>
            </div>

            <div className="invoice-info">
              <h2>FACTUUR</h2>
              <p><strong>Factuurnummer:</strong> INV-2025-00001</p>
              <p><strong>Factuurdatum:</strong> {today}</p>
              <p><strong>Vervaldatum:</strong> {dueDate}</p>
            </div>

            <div className="customer-info">
              <h3>Factuur aan:</h3>
              <p>
                <strong>Voorbeeldbedrijf B.V.</strong><br />
                Jan Jansen<br />
                Voorbeeldstraat 123<br />
                1234 AB Amsterdam<br />
                Nederland
              </p>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Omschrijving</th>
                  <th style={{ textAlign: 'center' }}>Aantal</th>
                  <th style={{ textAlign: 'right' }}>Prijs</th>
                  <th style={{ textAlign: 'right' }}>BTW</th>
                  <th style={{ textAlign: 'right' }}>Totaal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pro Abonnement - Januari 2025</td>
                  <td style={{ textAlign: 'center' }}>1</td>
                  <td style={{ textAlign: 'right' }}>€15,00</td>
                  <td style={{ textAlign: 'right' }}>€3,15</td>
                  <td style={{ textAlign: 'right' }}>€18,15</td>
                </tr>
                <tr className="total-row">
                  <td colSpan={4} style={{ textAlign: 'right' }}><strong>Totaal te betalen</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>€18,15</strong></td>
                </tr>
              </tbody>
            </table>

            <div className="invoice-footer">
              <div className="footer-grid">
                <div className="footer-section">
                  <h4>Betalingsinformatie</h4>
                  <p><strong>IBAN:</strong> NL49 KNAB 0776 5216 59</p>
                  <p><strong>Ten name van:</strong> LinqBoard</p>
                  <p><strong>Betaaltermijn:</strong> 14 dagen</p>
                  <p style={{ marginTop: '10px', color: '#8B7BE8' }}>
                    <strong>Gelieve bij betaling het factuurnummer te vermelden</strong>
                  </p>
                </div>
                
                <div className="footer-section">
                  <h4>Bedrijfsgegevens</h4>
                  <p><strong>LinqBoard</strong></p>
                  <p>Sikkelvoorde 4</p>
                  <p>3204 EJ Spijkenisse</p>
                  <p>Nederland</p>
                  <p style={{ marginTop: '10px' }}>
                    <strong>KVK:</strong> 97289388<br />
                    <strong>BTW:</strong> NL005260317B10
                  </p>
                </div>
                
                <div className="footer-section">
                  <h4>Contact</h4>
                  <p><strong>Email:</strong> info@linqboard.io</p>
                  <p><strong>Website:</strong> www.linqboard.io</p>
                  <p style={{ marginTop: '15px', color: '#8B7BE8' }}>
                    <strong>Vragen?</strong><br />
                    Neem gerust contact met ons op
                  </p>
                </div>
              </div>
              
              <div className="legal-text">
                <p><strong>Deze factuur is automatisch gegenereerd en digitaal geldig</strong></p>
                <p>Graag betalen binnen 14 dagen onder vermelding van het factuurnummer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
