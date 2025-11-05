'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export function RecentClients() {
  const firestore = useFirestore();
  const { user } = useUser();

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `/admin_users/${user.uid}/client_accounts`),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Clients</CardTitle>
        <CardDescription>
          Your most recently added clients.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="ml-4 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="ml-auto h-4 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {clients && clients.length > 0 ? (
              clients.map((client) => (
                <div key={client.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={client.avatarUrl}
                      alt={client.name}
                      data-ai-hint="person"
                    />
                    <AvatarFallback>
                      {client.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {client.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <div
                     className={cn(
                      'ml-auto font-medium',
                      client.balance > 0
                        ? 'text-destructive'
                        : client.balance < 0
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                    )}
                  >
                    {client.balance < 0 ? '-' : ''}₹{Math.abs(client.balance).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">No clients found.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
