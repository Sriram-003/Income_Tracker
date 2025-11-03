import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

type OverviewCardProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: 'increase' | 'decrease';
};

function OverviewCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
}: OverviewCardProps) {
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
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <OverviewCard
        title="Total Income (This Month)"
        value="$3,200.00"
        icon={DollarSign}
        change="+20.1%"
        changeType="increase"
      />
      <OverviewCard
        title="Outstanding Balance"
        value="$455.25"
        icon={DollarSign}
        change="-2.5%"
        changeType="decrease"
      />
      <OverviewCard
        title="New Clients (This Month)"
        value="+2"
        icon={Users}
        change="+5.5%"
        changeType="increase"
      />
      <OverviewCard title="Total Active Clients" value="5" icon={Users} />
    </div>
  );
}
