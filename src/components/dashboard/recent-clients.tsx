import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { clients } from '@/lib/data';
import { cn } from '@/lib/utils';

export function RecentClients() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Accounts</CardTitle>
        <CardDescription>
          An overview of your client balances.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {clients.map((client) => (
            <div key={client.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="person" />
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
                  client.balance > 0 ? 'text-green-600' : 'text-red-600',
                  client.balance === 0 && 'text-muted-foreground'
                )}
              >
                {client.balance < 0 ? '-' : ''}$
                {Math.abs(client.balance).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
