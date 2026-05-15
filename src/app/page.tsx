import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Clinic Wait-Time Tracker</h1>
      <p className="text-zinc-600 dark:text-zinc-400 max-w-md text-center">
        Real-time queuing and wait-time monitoring for Philippine clinics.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="underline">Staff &amp; admin login</Link>
        <Link href="/checkin" className="underline">Patient check-in</Link>
      </div>
    </main>
  );
}
