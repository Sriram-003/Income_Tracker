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
import { FileDown, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Client, IncomeEntry, Bill } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


type ReportItem = {
  type: 'Income' | 'Bill';
  date: Date;
  clientName: string;
  description: string;
  amount: number;
};

type AutoTable = {
  autoTable: (options: any) => void;
};

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportItem[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `/admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsQuery);

  const generateReportData = async () => {
    if (!user || !clients) return;
    setIsGenerating(true);

    const tenDaysAgo = subDays(new Date(), 10);
    const tenDaysAgoTimestamp = Timestamp.fromDate(tenDaysAgo);
    let combinedData: ReportItem[] = [];

    // Fetch Income Entries
    const incomeQuery = query(
      collection(firestore, `/admin_users/${user.uid}/income_entries`),
      where('createdAt', '>=', tenDaysAgoTimestamp)
    );
    const incomeSnapshot = await getDocs(incomeQuery);
    const incomeData = incomeSnapshot.docs.map(doc => {
      const data = doc.data() as IncomeEntry;
      const client = clients.find(c => c.id === data.clientId);
      return {
        type: 'Income',
        date: new Date(data.entryDate),
        clientName: client?.name || 'N/A',
        description: data.description,
        amount: data.amount,
      };
    }) as ReportItem[];
    combinedData = combinedData.concat(incomeData);

    // Fetch Bills for all clients
    for (const client of clients) {
        const billsQuery = query(
            collection(firestore, `/admin_users/${user.uid}/client_accounts/${client.id}/bills`),
            where('createdAt', '>=', tenDaysAgoTimestamp)
        );
        const billsSnapshot = await getDocs(billsQuery);
        const billsData = billsSnapshot.docs.map(doc => {
            const data = doc.data() as Bill;
            return {
                type: 'Bill',
                date: (data.createdAt as Timestamp).toDate(),
                clientName: client.name,
                description: `Bill #${doc.id.substring(0, 6)}`,
                amount: data.totalAmount,
            };
        });
        combinedData = combinedData.concat(billsData);
    }
    
    // Sort by date
    combinedData.sort((a, b) => b.date.getTime() - a.date.getTime());

    setReportData(combinedData);
    setIsGenerating(false);
  };
  
  const handleExport = (formatType: 'pdf' | 'excel') => {
      if (!reportData) return;

      const title = 'Last 10 Days Activity Report';
      const fileName = `10_day_report_${format(new Date(), 'yyyy-MM-dd')}`;
      
      const exportData = reportData.map(item => ({
        Date: format(item.date, 'PP'),
        Client: item.clientName,
        Type: item.type,
        Description: item.description,
        Amount: `₹${item.amount.toFixed(2)}`,
      }));

      if (formatType === 'pdf') {
          const doc = new jsPDF() as jsPDF & AutoTable;
          doc.text(title, 14, 16);
          doc.autoTable({
              head: [['Date', 'Client', 'Type', 'Description', 'Amount']],
              body: exportData.map(d => [d.Date, d.Client, d.Type, d.Description, d.Amount]),
              startY: 25,
          });
          doc.save(`${fileName}.pdf`);
      } else {
          const ws = utils.json_to_sheet(exportData);
          const wb = utils.book_new();
          utils.book_append_sheet(wb, ws, 'Last 10 Days');
          writeFile(wb, `${fileName}.xlsx`);
      }
  }


  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            View and export transactions from the last 10 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-start">
            <Button onClick={generateReportData} disabled={isGenerating}>
              <Eye className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'View 10-Day Report'}
            </Button>
          </div>
          
          {isGenerating && (
             <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
             </div>
          )}

          {reportData && (
              <div>
                  <h3 className="text-lg font-medium mb-4">Last 10 Days Activity</h3>
                  <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No transactions in the last 10 days.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reportData.map((item, index) => (
                                    <TableRow key={index} className={cn(
                                        item.type === 'Income' ? 'bg-green-50/50 dark:bg-green-900/20' : 'bg-red-50/50 dark:bg-red-900/20'
                                    )}>
                                        <TableCell>{format(item.date, 'PP')}</TableCell>
                                        <TableCell className="font-medium">{item.clientName}</TableCell>
                                        <TableCell>
                                            <span className={cn('px-2 py-1 text-xs rounded-full', 
                                                item.type === 'Income' ? 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-200' 
                                                                       : 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-200'
                                            )}>
                                                {item.type}
                                            </span>
                                        </TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right font-mono">₹{item.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                  </div>
                  <div className="flex gap-2 mt-4">
                      <Button onClick={() => handleExport('pdf')} variant="outline" disabled={reportData.length === 0}>
                           <FileDown className="mr-2 h-4 w-4" />
                           Export PDF
                      </Button>
                      <Button onClick={() => handleExport('excel')} variant="outline" disabled={reportData.length === 0}>
                           <FileDown className="mr-2 h-4 w-4" />
                           Export Excel
                      </Button>
                  </div>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
