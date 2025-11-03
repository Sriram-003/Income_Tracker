'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, query, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { Client, Product, ClientProductPrice } from '@/lib/types';

const clientPriceSchema = z.object({
  id: z.string().optional(), // For existing prices
  clientId: z.string().min(1, 'Client is required.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
});

const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters.'),
  image: z.any().optional(),
  imageUrl: z.string().optional(),
  clientPrices: z.array(clientPriceSchema).optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

type EditProductDialogProps = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProductDialog({ product, open, onOpenChange }: EditProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsQuery);

  const pricesQuery = useMemoFirebase(() => {
    if (!user || !product) return null;
    const pricesRef = collection(firestore, `admin_users/${user.uid}/client_product_prices`);
    return query(pricesRef, where('productId', '==', product.id));
  }, [firestore, user, product]);
  const { data: initialPrices } = useCollection<ClientProductPrice>(pricesQuery);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product.name,
      imageUrl: product.imageUrl,
      clientPrices: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "clientPrices"
  });
  
  useEffect(() => {
    if (initialPrices) {
      replace(initialPrices);
    }
  }, [initialPrices, replace]);

  useEffect(() => {
    form.reset({
      name: product.name,
      imageUrl: product.imageUrl,
      clientPrices: initialPrices || [],
    });
  }, [product, initialPrices, form]);


  const onSubmit = async (data: ProductFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    let newImageUrl = product.imageUrl || '';
    const imageFile = data.image?.[0];

    if (imageFile) {
      const storage = getStorage();
      const storageRef = ref(storage, `products/${user.uid}/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      newImageUrl = await getDownloadURL(uploadResult.ref);
    }

    try {
      // Update product name and image
      const productRef = doc(firestore, `/admin_users/${user.uid}/products`, product.id);
      await updateDocumentNonBlocking(productRef, {
        name: data.name,
        imageUrl: newImageUrl,
      });
      
      const pricesCollectionRef = collection(firestore, `/admin_users/${user.uid}/client_product_prices`);
      
      // Figure out which prices to add, update, or delete
      const incomingPrices = data.clientPrices || [];
      const existingPrices = initialPrices || [];

      // Prices to add
      const pricesToAdd = incomingPrices.filter(p => !p.id);
      for (const price of pricesToAdd) {
        await addDoc(pricesCollectionRef, {
          ...price,
          productId: product.id,
          adminId: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      // Prices to update
      const pricesToUpdate = incomingPrices.filter(p => p.id && existingPrices.some(e => e.id === p.id && (e.price !== p.price || e.clientId !== p.clientId)));
      for (const price of pricesToUpdate) {
        if (!price.id) continue;
        const priceRef = doc(pricesCollectionRef, price.id);
        await updateDocumentNonBlocking(priceRef, { price: price.price, clientId: price.clientId });
      }
      
      // Prices to delete
      const pricesToDelete = existingPrices.filter(e => !incomingPrices.some(p => p.id === e.id));
      for (const price of pricesToDelete) {
        if (!price.id) continue;
        const priceRef = doc(pricesCollectionRef, price.id);
        await deleteDocumentNonBlocking(priceRef);
      }


      toast({ title: 'Product Updated', description: `${data.name} has been updated.` });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the product details and client-specific prices.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Image (Optional)</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Client Prices</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`clientPrices.${index}.clientId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients?.map((client) => (
                                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`clientPrices.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                           <FormControl>
                            <Input type="number" step="0.01" placeholder="Price" {...field} className="w-28"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
               <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ clientId: '', price: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Client Price
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
