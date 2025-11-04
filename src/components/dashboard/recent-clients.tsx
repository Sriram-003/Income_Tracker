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
import { collection } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export function RecentClients() {
  const firestore = useFirestore();
  const { user } = useUser();

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `/admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);

  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Accounts</CardTitle>
        <CardDescription>
          An overview of your client balances.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
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
            {clients &&
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
              
                  </div>
                  <div
                    className={cn(
                      'ml-auto font-medium',
                      client.balance > 0 ? 'text-destructive' : 'text-green-600',
                      client.balance === 0 && 'text-muted-foreground'
                    )}
                  >
                    {client.balance > 0 ? '' : '-'}₹
                    {Math.abs(client.balance).toFixed(2)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
