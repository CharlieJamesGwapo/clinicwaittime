import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { StaffDashboard } from "./_dashboard";

export default async function StaffPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Staff Dashboard</h1>
            <p className="text-sm text-slate-500">
              {session?.user?.email} · {session?.user?.role}
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
        <StaffDashboard />
      </div>
    </main>
  );
}
