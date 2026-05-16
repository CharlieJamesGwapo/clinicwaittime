import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveSnapshot } from "./_live-snapshot";

const AdminCharts = dynamic(() => import("./_charts").then((m) => m.AdminCharts), {
  loading: () => (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1, 2].map((i) => (
          <Card key={i} className={i === 2 ? "lg:col-span-2" : ""}>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  ),
});

export default async function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <LiveSnapshot />
      <AdminCharts />
    </div>
  );
}
