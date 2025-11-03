import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AddClientDialog } from '@/components/accounts/add-client-dialog';
import { ClientListTable } from '@/components/accounts/client-list-table';

export default function AccountsPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client Accounts</CardTitle>
            <CardDescription>
              Manage your clients and their balances.
            </CardDescription>
          </div>
          <AddClientDialog />
        </div>
      </CardHeader>
      <CardContent>
        <ClientListTable />
      </CardContent>
    </Card>
  );
}
