import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function VatReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState('all');
  const [euSales, setEuSales] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalEuSales, setTotalEuSales] = useState(0);
  const [ossThreshold] = useState(10000);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [year, quarter, loading]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if admin (using the user ID from migration)
    if (!user || user.id !== '4a0b93e5-c165-4fdf-ae6d-b9bb9558aef9') {
      toast.error('Geen toegang');
      navigate('/dashboard');
      return;
    }
    
    setLoading(false);
  };

  const loadData = async () => {
    try {
      // Load EU sales summary
      let euQuery = supabase
        .from('eu_sales_summary')
        .select('*')
        .eq('year', parseInt(year));
      
      if (quarter !== 'all') {
        euQuery = euQuery.eq('quarter', parseInt(quarter));
      }
      
      const { data: euData, error: euError } = await euQuery.order('country');
      
      if (euError) throw euError;
      setEuSales(euData || []);
      
      // Calculate total
      const total = (euData || []).reduce((sum, row) => {
        const value = row.total_sales_excl_vat;
        return sum + parseFloat(typeof value === 'string' ? value : String(value || 0));
      }, 0);
      setTotalEuSales(total);

      // Load transactions
      let transQuery = supabase
        .from('mollie_transactions')
        .select('*, user_subscriptions!inner(plan)')
        .gte('created_at', `${year}-01-01`)
        .lte('created_at', `${year}-12-31`);
      
      if (quarter !== 'all') {
        const quarterStart = parseInt(quarter);
        const monthStart = (quarterStart - 1) * 3 + 1;
        const monthEnd = quarterStart * 3;
        transQuery = transQuery
          .gte('created_at', `${year}-${monthStart.toString().padStart(2, '0')}-01`)
          .lte('created_at', `${year}-${monthEnd.toString().padStart(2, '0')}-31`);
      }
      
      const { data: transData, error: transError } = await transQuery.order('created_at', { ascending: false });
      
      if (transError) throw transError;
      setTransactions(transData || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fout bij laden gegevens');
    }
  };

  const exportToCSV = () => {
    if (euSales.length === 0) {
      toast.error('Geen data om te exporteren');
      return;
    }

    const headers = ['Land', 'Jaar', 'Kwartaal', 'Omzet excl. BTW', 'BTW ingehouden', 'BTW-tarief', 'Aantal transacties'];
    const rows = euSales.map(row => [
      row.country,
      row.year,
      row.quarter,
      row.total_sales_excl_vat,
      row.total_vat_collected,
      row.vat_rate,
      row.transaction_count
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eu-sales-${year}${quarter !== 'all' ? `-Q${quarter}` : ''}.csv`;
    a.click();
    
    toast.success('CSV geëxporteerd');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Laden...</div>;
  }

  const ossWarning = totalEuSales > ossThreshold * 0.8; // Warning at 80% of threshold

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">BTW Rapportage</h1>
            <p className="text-muted-foreground">Overzicht van EU verkopen en BTW</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Terug
          </Button>
        </div>

        {ossWarning && (
          <Alert variant={totalEuSales > ossThreshold ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {totalEuSales > ossThreshold
                ? `OSS-drempel overschreden (€${ossThreshold.toLocaleString()}). Activeer OSS-registratie voor lokale BTW.`
                : `Let op: EU-omzet nadert OSS-drempel (€${totalEuSales.toFixed(2)} van €${ossThreshold.toLocaleString()})`
              }
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Selecteer periode voor rapportage</CardDescription>
              </div>
              <Button onClick={exportToCSV} disabled={euSales.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exporteer CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Heel jaar</SelectItem>
                    <SelectItem value="1">Q1</SelectItem>
                    <SelectItem value="2">Q2</SelectItem>
                    <SelectItem value="3">Q3</SelectItem>
                    <SelectItem value="4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EU Verkopen Samenvatting</CardTitle>
            <CardDescription>Per land en kwartaal</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Land</TableHead>
                  <TableHead>Kwartaal</TableHead>
                  <TableHead className="text-right">Omzet excl. BTW</TableHead>
                  <TableHead className="text-right">BTW</TableHead>
                  <TableHead className="text-right">BTW-tarief</TableHead>
                  <TableHead className="text-right">Transacties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {euSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Geen data beschikbaar
                    </TableCell>
                  </TableRow>
                ) : (
                  euSales.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.country}</TableCell>
                      <TableCell>Q{row.quarter} {row.year}</TableCell>
                      <TableCell className="text-right">€ {parseFloat(row.total_sales_excl_vat).toFixed(2)}</TableCell>
                      <TableCell className="text-right">€ {parseFloat(row.total_vat_collected).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.vat_rate}%</TableCell>
                      <TableCell className="text-right">{row.transaction_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recente Transacties</CardTitle>
            <CardDescription>Mollie betalingen met BTW details</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead className="text-right">BTW</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Geen transacties
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.created_at).toLocaleDateString('nl-NL')}</TableCell>
                      <TableCell>{tx.country || '-'}</TableCell>
                      <TableCell className="capitalize">{tx.customer_type || '-'}</TableCell>
                      <TableCell className="text-right">€ {parseFloat(tx.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {tx.vat_amount ? `€ ${parseFloat(tx.vat_amount).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          tx.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tx.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
