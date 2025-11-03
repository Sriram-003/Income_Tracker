'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase';
import type { Client } from '@/lib/types';
import { CreditCard, CalendarIcon } from 'lucide-react';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const paymentFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  description: z.string().min(1, 'Description is required.'),
  entryDate: z.date({
    required_error: 'A date for the payment is required.',
  }),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export function PaymentForm() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsQuery);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      clientId: '',
      amount: 0,
      description: 'Payment Received',
      entryDate: new Date(),
    },
  });

  const watchClientId = form.watch('clientId');

  useEffect(() => {
    if (clients) {
      const client = clients.find((c) => c.id === watchClientId);
      setSelectedClient(client || null);
    }
  }, [watchClientId, clients]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!user || !selectedClient) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Client or user not found.',
      });
      return;
    }

    const incomeData = {
      clientId: data.clientId,
      amount: data.amount,
      description: data.description,
      entryDate: data.entryDate.toISOString(),
      createdAt: serverTimestamp(),
      adminId: user.uid,
    };

    const incomeCollectionRef = collection(
      firestore,
      `admin_users/${user.uid}/income_entries`
    );

    try {
      await addDocumentNonBlocking(incomeCollectionRef, incomeData);

      const clientRef = doc(
        firestore,
        `admin_users/${user.uid}/client_accounts/${data.clientId}`
      );
      const newBalance = selectedClient.balance - data.amount;
      updateDocumentNonBlocking(clientRef, {
        balance: newBalance,
      });

      toast({
        title: 'Payment Recorded',
        description: `Payment for ${
          selectedClient.name
        } recorded. New balance is ₹${newBalance.toFixed(2)}.`,
      });
      form.reset();
      setSelectedClient(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record the payment.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record a Payment</CardTitle>
        <CardDescription>
          Select a client to record a payment and update their balance.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients &&
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedClient && (
              <div className="rounded-md border bg-muted p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Current Balance
                </p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    selectedClient.balance > 0
                      ? 'text-destructive'
                      : 'text-green-600'
                  )}
                >
                  {selectedClient.balance > 0 ? '' : '-'}₹
                  {Math.abs(selectedClient.balance).toFixed(2)}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Invoice #123 Payment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!selectedClient}>
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
