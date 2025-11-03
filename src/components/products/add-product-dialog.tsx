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
import { PlusCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { collection, serverTimestamp } from 'firebase/firestore';
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

const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters.'),
  image: z.any().optional(),
  clientId: z.string().optional(),
  price: z.coerce.number().optional(),
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
      clientId: '',
      price: 0,
    },
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
      const productDocRef = await addDocumentNonBlocking(productsCollectionRef, {
        name: data.name,
        adminId: user.uid,
        createdAt: serverTimestamp(),
        imageUrl: imageUrl,
        defaultPrice: 0,
      });

      if (productDocRef && data.clientId && data.clientId !== 'none' && data.price) {
        const clientProductPricesCollectionRef = collection(
          firestore,
          `/admin_users/${user.uid}/client_accounts/${data.clientId}/client_product_prices`
        );
        await addDocumentNonBlocking(clientProductPricesCollectionRef, {
          clientId: data.clientId,
          productId: productDocRef.id,
          price: data.price,
          createdAt: serverTimestamp(),
        });
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
      <DialogContent className="sm:max-w-[480px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Add a new product and set a default price for a specific client.
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
