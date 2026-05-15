import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const session = await auth();

  return (
    <main className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" type="submit">Sign out</Button>
        </form>
      </header>
      <p className="text-muted-foreground">
        Signed in as {session?.user?.email} ({session?.user?.role})
      </p>
      <p className="mt-4">Analytics charts will live here in Phase 4.</p>
    </main>
  );
}
