'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Client, IncomeEntry, Bill, Product } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { format } from 'date-fns';

type AutoTable = {
  autoTable: (options: any) => void;
};

export default function ReportsPage() {
  const [month, setMonth] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `/admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `/admin_users/${user.uid}/products`);
  }, [firestore, user]);
  const { data: products } = useCollection<Product>(productsQuery);

  const handleExport = async (
    formatType: 'pdf' | 'excel',
    scope: 'monthly' | 'all' | 'yearly'
  ) => {
    if (!user || !clients) return;
    setIsGenerating(true);

    const incomeQuery = collection(
      firestore,
      `admin_users/${user.uid}/income_entries`
    );
    const incomeSnapshots = await getDocs(incomeQuery);
    let incomeEntries: IncomeEntry[] = incomeSnapshots.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as IncomeEntry
    );

    const billsPromises = clients.map((c) =>
      getDocs(
        collection(
          firestore,
          `/admin_users/${user.uid}/client_accounts/${c.id}/bills`
        )
      )
    );
    const billsSnapshots = await Promise.all(billsPromises);
    let bills: (Bill & { clientName: string })[] = [];
    billsSnapshots.forEach((snapshot, index) => {
      const clientName = clients[index].name;
      snapshot.docs.forEach((doc) => {
        bills.push({ ...(doc.data() as Bill), id: doc.id, clientName });
      });
    });

    let filteredIncome = incomeEntries;
    let filteredBills = bills;
    let reportTitle = 'All Data Report';
    let fileName = `all_data_report_${format(new Date(), 'yyyy-MM-dd')}`;

    if (scope === 'monthly') {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      filteredIncome = incomeEntries.filter((i) => {
        const entryDate = new Date(i.entryDate);
        return entryDate >= startDate && entryDate <= endDate;
      });
      filteredBills = bills.filter((b) => {
        const billDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
        return billDate && billDate >= startDate && billDate <= endDate;
      });
      reportTitle = `Monthly Report - ${format(startDate, 'MMMM yyyy')}`;
      fileName = `monthly_report_${year}_${month}`;
    } else if (scope === 'yearly') {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      filteredIncome = incomeEntries.filter((i) => {
        const entryDate = new Date(i.entryDate);
        return entryDate >= startDate && entryDate <= endDate;
      });
      filteredBills = bills.filter((b) => {
        const billDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
        return billDate && billDate >= startDate && billDate <= endDate;
      });
      reportTitle = `Year-End Report - ${year}`;
      fileName = `yearly_report_${year}`;
    }

    const incomeExportData = filteredIncome.map((i) => ({
      Date: format(new Date(i.entryDate), 'PP'),
      Client: clients.find((c) => c.id === i.clientId)?.name || 'N/A',
      Description: i.description,
      Amount: `₹${i.amount.toFixed(2)}`,
    }));

    const billsExportData = filteredBills.map((b) => ({
      Date: b.createdAt ? format(b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt) , 'PP') : 'N/A',
      Client: b.clientName,
      'Bill ID': b.id,
      'Total Amount': `₹${b.totalAmount.toFixed(2)}`,
    }));

    if (formatType === 'pdf') {
      const doc = new jsPDF() as jsPDF & AutoTable;
      doc.text(reportTitle, 14, 16);

      if (incomeExportData.length > 0) {
        doc.text('Income', 14, 25);
        doc.autoTable({
          head: [['Date', 'Client', 'Description', 'Amount']],
          body: incomeExportData.map((i) => [
            i.Date,
            i.Client,
            i.Description,
            i.Amount,
          ]),
          startY: 30,
        });
      }

      if (billsExportData.length > 0) {
        const startY =
          incomeExportData.length > 0
            ? (doc as any).autoTable.previous.finalY + 10
            : 25;
        doc.text('Bills', 14, startY);
        doc.autoTable({
          head: [['Date', 'Client', 'Bill ID', 'Total Amount']],
          body: billsExportData.map((b) => [
            b.Date,
            b.Client,
            b['Bill ID'],
            b['Total Amount'],
          ]),
          startY: startY + 5,
        });
      }

      doc.save(`${fileName}.pdf`);
    } else {
      // Excel
      const incomeWs = utils.json_to_sheet(incomeExportData);
      const billsWs = utils.json_to_sheet(billsExportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, incomeWs, 'Income');
      utils.book_append_sheet(wb, billsWs, 'Bills');
      writeFile(wb, `${fileName}.xlsx`);
    }

    setIsGenerating(false);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your income and transaction data in various formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Monthly Report</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(0, i).toLocaleString('default', {
                          month: 'long',
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const yearValue = new Date().getFullYear() - i;
                      return (
                        <SelectItem
                          key={yearValue}
                          value={yearValue.toString()}
                        >
                          {yearValue}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleExport('pdf', 'monthly')}
                  disabled={isGenerating}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Export PDF'}
                </Button>
                <Button
                  onClick={() => handleExport('excel', 'monthly')}
                  disabled={isGenerating}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Export Excel'}
                </Button>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Yearly Report</h3>
             <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleExport('pdf', 'yearly')}
                  disabled={isGenerating}
                  variant="secondary"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : `Export ${year} (PDF)`}
                </Button>
                 <Button
                  onClick={() => handleExport('excel', 'yearly')}
                  disabled={isGenerating}
                  variant="secondary"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : `Export ${year} (Excel)`}
                </Button>
              </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Complete History</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleExport('pdf', 'all')}
                variant="outline"
                disabled={isGenerating}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Export All (PDF)'}
              </Button>
              <Button
                onClick={() => handleExport('excel', 'all')}
                variant="outline"
                disabled={isGenerating}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Export All (Excel)'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
