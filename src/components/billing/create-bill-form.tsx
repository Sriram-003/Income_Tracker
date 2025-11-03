'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { clients, products } from '@/lib/data';
import type { Client, Product } from '@/lib/types';
import { PlusCircle, Trash2, FileText } from 'lucide-react';
import { BillPreview } from './bill-preview';
import { ContentSuggestion } from './content-suggestion';

const billItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
});

const billFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required.'),
  items: z.array(billItemSchema).min(1, 'At least one item is required.'),
});

export type BillFormData = z.infer<typeof billFormSchema>;

export function CreateBillForm() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [billDetails, setBillDetails] = useState<BillFormData | null>(null);

  const form = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      clientId: '',
      items: [{ productId: '', quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchClientId = form.watch('clientId');
  const watchItems = form.watch('items');

  useState(() => {
    const client = clients.find((c) => c.id === watchClientId);
    setSelectedClient(client || null);
  });

  const handleProductChange = (productId: string, index: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.price`, product.defaultPrice);
    }
  };

  const onSubmit = (data: BillFormData) => {
    setBillDetails(data);
  };

  if (billDetails && selectedClient) {
    const billTotal = billDetails.items.reduce(
        (acc, item) => acc + item.quantity * item.price,
        0
      );
    const newBalance = selectedClient.balance + billTotal;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <BillPreview client={selectedClient} products={products} billDetails={billDetails} />
        </div>
        <div className="lg:col-span-1">
            <ContentSuggestion
                clientName={selectedClient.name}
                pastBalance={selectedClient.balance}
                billAmount={billTotal}
                currentBalance={newBalance}
            />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Bill</CardTitle>
        <CardDescription>
          Select a client and add products to generate a bill.
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
                      const client = clients.find((c) => c.id === value);
                      setSelectedClient(client || null);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
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

            <div>
              <Label className="mb-2 block">Bill Items</Label>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-start"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <Controller
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field: controllerField }) => (
                          <Select
                            onValueChange={(value) => {
                              controllerField.onChange(value);
                              handleProductChange(value, index);
                            }}
                            defaultValue={controllerField.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        {...form.register(`items.${index}.quantity`)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                       <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        {...form.register(`items.${index}.price`)}
                      />
                    </div>
                     <div className="col-span-4 sm:col-span-2">
                      <Input
                          type="text"
                          readOnly
                          value={
                              (watchItems[index]?.quantity || 0) *
                              (watchItems[index]?.price || 0)
                          }
                          placeholder="Total"
                          className="bg-muted"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.items?.message && (
                  <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.items.message}</p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ productId: '', quantity: 1, price: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardContent>
          <CardFooter>
            <Button type="submit">
              <FileText className="mr-2 h-4 w-4" />
              Generate Bill & Preview
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
