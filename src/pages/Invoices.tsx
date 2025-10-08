import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_country: string;
  customer_type: string;
  vat_number: string | null;
  amount_excl_vat: number;
  vat_rate: number;
  vat_amount: number;
  amount_incl_vat: number;
  status: string;
  pdf_url: string | null;
}

export default function Invoices() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    
    await loadInvoices();
  };

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });
      
      if (error) throw error;
      setInvoices(data || []);

      // Load E-boekhouden sync logs
      const { data: syncData } = await supabase
        .from('eboekhouden_sync_log')
        .select('*')
        .eq('sync_type', 'invoice')
        .order('synced_at', { ascending: false });
      
      setSyncLogs(syncData || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Fout bij laden facturen');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { invoiceId: invoice.id }
      });

      if (error) throw error;

      // Create HTML blob and download
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.html`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Factuur gedownload');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Fout bij downloaden factuur');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Laden...</div>;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Facturen</h1>
            <p className="text-muted-foreground">Overzicht van al je facturen</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Terug
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Jouw facturen</CardTitle>
            <CardDescription>Download je facturen voor administratie</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nog geen facturen beschikbaar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factuurnummer</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Land</TableHead>
                    <TableHead className="text-right">Excl. BTW</TableHead>
                    <TableHead className="text-right">BTW ({" "}%)</TableHead>
                    <TableHead className="text-right">Totaal</TableHead>
                    <TableHead className="text-center">E-boekhouden</TableHead>
                    <TableHead className="text-center">Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const syncLog = syncLogs.find(log => log.invoice_id === invoice.id);
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          {new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}
                        </TableCell>
                        <TableCell>{invoice.customer_country}</TableCell>
                        <TableCell className="text-right">
                          € {Number(invoice.amount_excl_vat).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          € {Number(invoice.vat_amount).toFixed(2)} ({Number(invoice.vat_rate).toFixed(0)}%)
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          € {Number(invoice.amount_incl_vat).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {syncLog ? (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              syncLog.status === 'success' 
                                ? 'bg-blue-100 text-blue-800' 
                                : syncLog.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {syncLog.status === 'success' ? '✓ Sync' : 
                               syncLog.status === 'failed' ? '✗ Fout' : '⏳ Bezig'}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Wachten</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
