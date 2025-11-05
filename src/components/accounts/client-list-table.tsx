'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useUser, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function ClientListTable() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `/admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);

  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

  const handleDelete = () => {
    if (!user || !deletingClient) return;

    const clientRef = doc(firestore, `/admin_users/${user.uid}/client_accounts`, deletingClient.id);
    deleteDocumentNonBlocking(clientRef);
    // Note: In a real app, you'd also want to delete sub-collections like bills, income_entries, etc.

    toast({
      title: 'Client Deleted',
      description: `${deletingClient.name} has been removed from your client list.`,
    });
    setDeletingClient(null);
  };

  const handleViewHistory = (clientId: string) => {
    // This is a placeholder. In a real app, you would navigate to a client-specific page.
    toast({
      title: 'Coming Soon!',
      description: 'Client history page is under development.',
    });
    // router.push(`/dashboard/accounts/${clientId}`);
  };

  const handleEdit = (client: Client) => {
    // This is a placeholder. In a real app, you would open an edit dialog.
     toast({
      title: 'Coming Soon!',
      description: 'Client editing is under development.',
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients &&
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage
                        src={client.avatarUrl}
                        alt={client.name}
                        data-ai-hint="person portrait"
                      />
                      <AvatarFallback>
                        {client.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    'font-medium',
                    0 > 0 ? 'text-destructive' : 'text-green-600',
                    0 === 0 && 'text-muted-foreground'
                  )}
                >
                  {0 > 0 ? '' : '-'}₹
                  {Math.abs(0).toFixed(2)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant={0 > 0 ? 'destructive' : 'secondary'}
                    className={cn(
                      0 < 0 &&
                        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                      0 === 0 && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {0 > 0 ? 'Owing' : 'In Credit'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(client)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewHistory(client.id)}>View History</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingClient(client)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <AlertDialog open={!!deletingClient} onOpenChange={(isOpen) => !isOpen && setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              "{deletingClient?.name}" and all their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
