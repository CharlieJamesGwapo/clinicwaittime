import { AdminCharts } from "./_charts";
import { LiveSnapshot } from "./_live-snapshot";

export default async function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <LiveSnapshot />
      <AdminCharts />
    </div>
  );
}
