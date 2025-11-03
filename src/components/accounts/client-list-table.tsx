'use client';

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
import { clients } from '@/lib/data';
import { cn } from '@/lib/utils';

export function ClientListTable() {
  return (
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
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="person portrait" />
                  <AvatarFallback>
                    {client.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell
              className={cn(
                'font-medium',
                client.balance < 0 ? 'text-destructive' : 'text-green-600',
                client.balance === 0 && 'text-muted-foreground'
              )}
            >
              {client.balance < 0 ? '-' : ''}${Math.abs(client.balance).toFixed(2)}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge
                variant={client.balance < 0 ? 'destructive' : 'secondary'}
                className={cn(
                  client.balance > 0 &&
                    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                  client.balance === 0 && 'bg-muted text-muted-foreground'
                )}
              >
                {client.balance < 0 ? 'Owing' : 'In Credit'}
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
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>View History</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
