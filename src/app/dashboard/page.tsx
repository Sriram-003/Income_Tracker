import { IncomeChart } from '@/components/dashboard/income-chart';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { RecentClients } from '@/components/dashboard/recent-clients';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <OverviewCards />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncomeChart />
        </div>
        <div className="lg:col-span-1">
          <RecentClients />
        </div>
      </div>
    </div>
  );
}
