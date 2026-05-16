import { LogOut, LayoutDashboard, Ticket, Users, Settings } from "lucide-react";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AdminTabs } from "./_tabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const tabs = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/admin/tickets", label: "Tickets", icon: <Ticket className="h-4 w-4" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <main id="main" className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">
                Clinic
              </Link>
              <span className="text-slate-300">/</span>
              <span>Admin</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {session?.user?.email} · {session?.user?.role}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="outline" type="submit" className="cursor-pointer">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <AdminTabs tabs={tabs} />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">{children}</div>
    </main>
  );
}
