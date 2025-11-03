'use client';

import { useState, useEffect } from 'react';
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
import {
  addDocumentNonBlocking,
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
  updateDocumentNonBlocking,
} from '@/firebase';
import type { Client, Product, ClientProductPrice } from '@/lib/types';
import { PlusCircle, Trash2, FileText, ArrowLeft } from 'lucide-react';
import { BillPreview } from './bill-preview';
import { ContentSuggestion } from './content-suggestion';
import { collection, serverTimestamp, doc, query, where, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const billItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  productName: z.string(), // For temporary products
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  isTemp: z.boolean().default(false),
});

const billFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required.'),
  items: z.array(billItemSchema).min(1, 'At least one item is required.'),
});

export type BillFormData = z.infer<typeof billFormSchema>;

export function CreateBillForm() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [billDetails, setBillDetails] = useState<BillFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `admin_users/${user.uid}/products`);
  }, [firestore, user]);
  const { data: products } = useCollection<Product>(productsQuery);

  const form = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      clientId: '',
      items: [{ productId: '', productName: '', quantity: 1, price: 0, isTemp: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchClientId = form.watch('clientId');
  const watchItems = form.watch('items');

  const clientPricesQuery = useMemoFirebase(() => {
    if (!user || !watchClientId) return null;
    const pricesRef = collection(
      firestore,
      `/admin_users/${user.uid}/client_product_prices`
    );
    return query(pricesRef, where('clientId', '==', watchClientId));
  }, [firestore, user, watchClientId]);

  const { data: clientPrices } = useCollection<ClientProductPrice>(clientPricesQuery);

  useEffect(() => {
    if (clients) {
      const client = clients.find((c) => c.id === watchClientId);
      setSelectedClient(client || null);
    }
  }, [watchClientId, clients]);

  const handleProductChange = (productId: string, index: number) => {
    if (productId === 'temp-product') {
      form.setValue(`items.${index}.isTemp`, true);
      form.setValue(`items.${index}.productName`, '');
      form.setValue(`items.${index}.price`, 0);
    } else {
      const product = products?.find((p) => p.id === productId);
      if (product) {
        form.setValue(`items.${index}.isTemp`, false);
        form.setValue(`items.${index}.productName`, product.name);
        
        const clientPrice = clientPrices?.find(cp => cp.productId === productId);
        if (clientPrice) {
          form.setValue(`items.${index}.price`, clientPrice.price);
        } else {
          form.setValue(`items.${index}.price`, product.defaultPrice || 0);
        }
      }
    }
  };

  const onPreview = (data: BillFormData) => {
    setBillDetails(data);
  };
  
  const handleConfirmAndSave = async () => {
    if (!user || !selectedClient || !billDetails) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Client, user or bill details not found.',
      });
      return;
    }
    setIsSaving(true);

    const billTotal = billDetails.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    const billData = {
      clientId: billDetails.clientId,
      billDate: serverTimestamp(),
      totalAmount: billTotal,
      createdAt: serverTimestamp(),
      adminId: user.uid,
    };

    const billsCollectionRef = collection(
      firestore,
      `admin_users/${user.uid}/client_accounts/${billDetails.clientId}/bills`
    );

    try {
       const docRef = await addDoc(billsCollectionRef, billData);
       const billId = docRef.id;

       const billItemsCollectionRef = collection(
        firestore,
        `admin_users/${user.uid}/client_accounts/${billDetails.clientId}/bills/${billId}/bill_items`
      );
      
      const itemPromises = billDetails.items.map((item) => {
        return addDoc(billItemsCollectionRef, {
          productId: item.isTemp ? billId + '-' + Date.now() : item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          billId: billId,
          adminId: user.uid,
          clientId: billDetails.clientId,
          createdAt: serverTimestamp(),
        });
      });

      await Promise.all(itemPromises);

      const clientRef = doc(firestore, `admin_users/${user.uid}/client_accounts/${billDetails.clientId}`);
      await updateDocumentNonBlocking(clientRef, {
        balance: selectedClient.balance + billTotal
      });

      toast({
        title: 'Bill Saved!',
        description: 'The bill has been successfully saved and the client balance updated.',
      });

    } catch (error) {
       console.error("Error saving bill: ", error);
       toast({
        variant: 'destructive',
        title: 'Error Saving Bill',
        description: 'An unexpected error occurred while saving the bill.',
      });
    } finally {
      setIsSaving(false);
      createNewBill();
    }
  };


  const createNewBill = () => {
    setBillDetails(null);
    setSelectedClient(null);
    form.reset({
      clientId: '',
      items: [{ productId: '', productName: '', quantity: 1, price: 0, isTemp: false }],
    });
  };

  if (billDetails && selectedClient && products) {
    const billTotal = billDetails.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    const newBalance = selectedClient.balance + billTotal;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={createNewBill}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Form
          </Button>
           <Button onClick={handleConfirmAndSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Confirm & Save Bill'}
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BillPreview
              client={selectedClient}
              products={products}
              billDetails={billDetails}
            />
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
        <form onSubmit={form.handleSubmit(onPreview)}>
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

            <div>
              <Label className="mb-2 block">Bill Items</Label>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-start"
                  >
                    <div className="col-span-12 sm:col-span-4">
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
                              {products &&
                                products.map((product) => (
                                  <SelectItem
                                    key={product.id}
                                    value={product.id}
                                  >
                                    {product.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="temp-product">-- Add Temporary Product --</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {watchItems[index]?.isTemp && (
                      <div className="col-span-12 sm:col-span-4">
                        <Input
                          placeholder="Temporary Product Name"
                          {...form.register(`items.${index}.productName`)}
                        />
                      </div>
                    )}
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
                          watchItems[index]
                            ? (
                                (watchItems[index]?.quantity || 0) *
                                (watchItems[index]?.price || 0)
                              ).toFixed(2)
                            : '0.00'
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
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.items.message}
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ productId: '', productName: '', quantity: 1, price: 0, isTemp: false })}
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

    