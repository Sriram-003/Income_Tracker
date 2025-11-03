import type { Client, Product } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { Button } from '../ui/button';
import { Download, Share2 } from 'lucide-react';
import type { BillFormData } from './create-bill-form';

type BillPreviewProps = {
  client: Client;
  products: Product[];
  billDetails: BillFormData;
};

export function BillPreview({
  client,
  products,
  billDetails,
}: BillPreviewProps) {
  const billTotal = billDetails.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );
  const newBalance = client.balance + billTotal;

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icons.logo className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">LedgerSync</h1>
            </div>
            <p className="text-muted-foreground">Invoice</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{client.name}</p>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billDetails.items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${item.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${(item.quantity * item.price).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Separator className="my-6" />
        <div className="grid grid-cols-2 gap-4">
          <div></div>
          <div className="space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Previous Balance:</span>
              <span className="font-medium">
                ${client.balance.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">This Bill:</span>
              <span className="font-medium">${billTotal.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>New Balance Due:</span>
              <span>${newBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4 sm:flex-row sm:justify-end sm:items-center bg-muted/50 p-6">
         <p className="text-sm text-muted-foreground text-center sm:text-left">Thank you for your business!</p>
        <div className="flex gap-2 justify-center">
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download
            </Button>
            <Button>
                <Share2 className="mr-2 h-4 w-4" />
                Share
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
