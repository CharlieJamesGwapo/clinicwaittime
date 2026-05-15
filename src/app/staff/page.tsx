import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { StaffDashboard } from "./_dashboard";

export default async function StaffPage() {
  const session = await auth();

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Staff Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {session?.user?.email} ({session?.user?.role})
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
    </main>
  );
}
