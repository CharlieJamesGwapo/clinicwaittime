"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowLeft, LogIn, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/staff");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <p className="text-sm text-slate-500">Staff & admin access</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>
          {error && (
            <p
              role="alert"
              aria-live="polite"
              className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-2"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={pending}
            size="lg"
            className="h-12 text-base cursor-pointer"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <div className="rounded-md bg-slate-50 border p-3 text-xs text-slate-600">
            <p className="font-medium text-slate-700">Demo accounts</p>
            <ul className="mt-1 space-y-0.5 font-mono">
              <li>nurse@clinic.test · nurse123</li>
              <li>admin@clinic.test · admin123</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main id="main" className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4 py-8">
      <Link
        href="/"
        className="self-start sm:self-auto sm:absolute sm:top-4 sm:left-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4 sm:mb-0 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Link>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
