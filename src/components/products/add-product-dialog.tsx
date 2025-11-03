'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  addDocumentNonBlocking,
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { Client } from '@/lib/types';

const clientPriceSchema = z.object({
  clientId: z.string().min(1, 'Client is required.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
});

const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters.'),
  image: z.any().optional(),
  clientPrices: z.array(clientPriceSchema).optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsQuery);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      clientPrices: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "clientPrices"
  });

  const onSubmit = async (data: ProductFormData) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to add a product.',
      });
      return;
    }
    setIsSubmitting(true);

    let imageUrl = '';
    const imageFile = data.image?.[0];

    if (imageFile) {
      try {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `products/${user.uid}/${Date.now()}_${imageFile.name}`
        );
        const uploadResult = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      } catch (error) {
        console.error('Image upload failed:', error);
        toast({
          variant: 'destructive',
          title: 'Image Upload Failed',
          description: 'Could not upload the product image. Please try again.',
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const productsCollectionRef = collection(
        firestore,
        `/admin_users/${user.uid}/products`
      );
      const productDocRef = await addDoc(productsCollectionRef, {
        name: data.name,
        adminId: user.uid,
        createdAt: serverTimestamp(),
        imageUrl: imageUrl,
        defaultPrice: 0, // This can be a standard default or managed differently
      });

      if (productDocRef && data.clientPrices) {
        const clientProductPricesCollectionRef = collection(
          firestore,
          `admin_users/${user.uid}/client_product_prices`
        );
        for (const clientPrice of data.clientPrices) {
           await addDoc(clientProductPricesCollectionRef, {
            clientId: clientPrice.clientId,
            productId: productDocRef.id,
            price: clientPrice.price,
            createdAt: serverTimestamp(),
            adminId: user.uid,
          });
        }
      }

      toast({
        title: 'Product Added',
        description: `Successfully added ${data.name}.`,
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Failed to add product',
        description: 'An error occurred while saving the product.',
      });
    }


    setIsSubmitting(false);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Add a new product and set prices for specific clients.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Organic Apples" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Client Prices (Optional)</FormLabel>
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
                              <SelectTrigger>
                                <SelectValue placeholder="Select Client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients?.map((client) => (
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
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Client Price
              </Button>
            </div>


            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
