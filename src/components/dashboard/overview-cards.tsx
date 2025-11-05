'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IndianRupee, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Client, IncomeEntry } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useMemo } from 'react';

type OverviewCardProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: 'increase' | 'decrease';
  isLoading?: boolean;
};

function OverviewCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  isLoading,
}: OverviewCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-1 h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground flex items-center">
            {changeType === 'increase' ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            {change} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewCards() {
  const firestore = useFirestore();
  const { user } = useUser();

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `/admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);

  const { data: clients, isLoading: clientsLoading } = useCollection<Client>(clientsQuery);
  
  const incomeEntriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Point to a non-existent collection to simulate empty data
    return collection(firestore, `admin_users/${user.uid}/no_income_entries`);
  }, [firestore, user]);
  
  const { data: incomeEntries, isLoading: incomeLoading } = useCollection<IncomeEntry>(incomeEntriesQuery);

  const { totalIncomeThisMonth, outstandingBalance, totalClients, newClientsThisMonth } = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalIncomeThisMonth =
      incomeEntries
        ?.filter(entry => {
          if (!entry.entryDate) return false;
          const entryDate = new Date(entry.entryDate);
          return entryDate >= startOfMonth;
        })
        .reduce((sum, entry) => sum + entry.amount, 0) || 0;

    const outstandingBalance =
      clients?.reduce((sum, client) => sum + client.balance, 0) || 0;

    const totalClients = clients?.length || 0;

    const newClientsThisMonth = clients
      ?.filter(client => {
          if (!client.createdAt) return false;
          const createdAt = client.createdAt instanceof Timestamp ? client.createdAt.toDate() : new Date(client.createdAt);
          return createdAt >= startOfMonth;
      })
      .length || 0;
    
    return { totalIncomeThisMonth, outstandingBalance, totalClients, newClientsThisMonth };
  }, [clients, incomeEntries]);

  const isLoading = clientsLoading || incomeLoading;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <OverviewCard
        title="Total Income (This Month)"
        value={`₹${totalIncomeThisMonth.toFixed(2)}`}
        icon={IndianRupee}
        isLoading={isLoading}
      />
      <OverviewCard
        title="Outstanding Balance"
        value={`₹${outstandingBalance.toFixed(2)}`}
        icon={IndianRupee}
        isLoading={isLoading}
      />
      <OverviewCard
        title="Total Active Clients"
        value={totalClients.toString()}
        icon={Users}
        isLoading={isLoading}
      />
       <OverviewCard
        title="New Clients (This Month)"
        value={`+${newClientsThisMonth}`}
        icon={Users}
        isLoading={isLoading}
      />
    </div>
  );
}
