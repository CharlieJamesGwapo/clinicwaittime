import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AdminCharts } from "./_charts";

export default async function AdminPage() {
  const session = await auth();

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {session?.user?.email} ({session?.user?.role}) — last 7 days
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" type="submit">Sign out</Button>
        </form>
      </header>
      <AdminCharts />
    </main>
  );
}
