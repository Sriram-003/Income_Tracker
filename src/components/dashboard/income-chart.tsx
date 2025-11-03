'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const monthlyIncomeChartData = [
  { month: 'Jan', income: 1800 },
  { month: 'Feb', income: 2200 },
  { month: 'Mar', income: 2500 },
  { month: 'Apr', income: 2100 },
  { month: 'May', income: 3200 },
  { month: 'Jun', income: 2900 },
  { month: 'Jul', income: 3500 },
  { month: 'Aug', income: 3100 },
  { month: 'Sep', income: 2800 },
  { month: 'Oct', income: 3300 },
  { month: 'Nov', income: 3700 },
  { month: 'Dec', income: 4100 },
];


export function IncomeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Income</CardTitle>
        <CardDescription>
          An overview of your income for the current year.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={monthlyIncomeChartData}>
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
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
              }}
            />
            <Bar
              dataKey="income"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
