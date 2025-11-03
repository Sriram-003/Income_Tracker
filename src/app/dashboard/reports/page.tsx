import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your income and transaction data in various formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button>
            <FileDown className="mr-2 h-4 w-4" />
            Export Income (PDF)
          </Button>
          <Button>
            <FileDown className="mr-2 h-4 w-4" />
            Export Income (Excel)
          </Button>
          <Button variant="secondary">
            <FileDown className="mr-2 h-4 w-4" />
            Export All Data (PDF)
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Year-End Summary</CardTitle>
          <CardDescription>
            Generate a comprehensive summary of the fiscal year.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button>
                <FileDown className="mr-2 h-4 w-4" />
                Generate 2023 Report (PDF)
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
