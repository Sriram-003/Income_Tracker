'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Client, IncomeEntry } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export function IncomeChart() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `admin_users/${user.uid}/client_accounts`);
  }, [firestore, user]);
  const { data: clients, isLoading: clientsLoading } = useCollection<Client>(clientsQuery);
  
  const incomeQuery = useMemoFirebase(() => {
    if (!user) return null;
    if (selectedClientId === 'all') {
      return collection(firestore, `admin_users/${user.uid}/income_entries`);
    }
    return query(
        collection(firestore, `admin_users/${user.uid}/income_entries`),
        where('clientId', '==', selectedClientId)
    );
  }, [firestore, user, selectedClientId]);

  const { data: incomeEntries, isLoading: incomeLoading } = useCollection<IncomeEntry>(incomeQuery);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('default', { month: 'short' }),
      income: 0,
    }));
    
    if (incomeEntries) {
        incomeEntries.forEach(entry => {
            const monthIndex = new Date(entry.entryDate).getMonth();
            months[monthIndex].income += entry.amount;
        });
    }

    return months;
  }, [incomeEntries]);

  const isLoading = clientsLoading || incomeLoading;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Monthly Income</CardTitle>
          <CardDescription>
            An overview of your income for the current year.
          </CardDescription>
        </div>
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients?.map(client => (
                <SelectItem key={client.id} value={client.id}>
                    {client.name}
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pl-2">
        {isLoading ? (
            <div className="w-full h-[350px] p-4">
                <Skeleton className="w-full h-full" />
            </div>
        ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="month"
              stroke="hsl(var(--foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
              }}
              formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Income']}
            />
            <Bar
              dataKey="income"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
