'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { addDocumentNonBlocking, useAuth, useFirestore, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';

export function AddClientDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('John Doe');
  const firestore = useFirestore();
  const { user } = useUser();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to add a client.',
      });
      return;
    }

    const clientData = {
      name: name,
      adminId: user.uid,
      createdAt: new Date().toISOString(),
      balance: 0,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    };

    const collectionRef = collection(
      firestore,
      `/admin_users/${user.uid}/client_accounts`
    );
    addDocumentNonBlocking(collectionRef, clientData);

    toast({
      title: 'Client Added',
      description: `Successfully added ${name} to your client list.`,
    });
    setOpen(false);
    setName('John Doe');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the details for the new client account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
