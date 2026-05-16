"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/messages";

type Labels = {
  title: string;
  subtitle: string;
  name: string;
  namePlaceholder: string;
  phone: string;
  email: string;
  channel: string;
  channelSms: string;
  channelSmsDesc: string;
  channelEmail: string;
  channelEmailDesc: string;
  reason: string;
  reasonHelp: string;
  reasonPlaceholder: string;
  priority: string;
  priorityNone: string;
  priorityNoneDesc: string;
  priorityPwd: string;
  priorityPwdDesc: string;
  priorityCitizen: string;
  priorityCitizenDesc: string;
  priorityPregnant: string;
  priorityPregnantDesc: string;
  submit: string;
  submitting: string;
};

export function CheckinForm({ locale, labels }: { locale: Locale; labels: Labels }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [channel, setChannel] = useState<"SMS" | "EMAIL">("SMS");
  const [priorityType, setPriorityType] = useState("NONE");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const priorities = [
    { value: "NONE", label: labels.priorityNone, desc: labels.priorityNoneDesc },
    { value: "PWD", label: labels.priorityPwd, desc: labels.priorityPwdDesc },
    { value: "SENIOR", label: labels.priorityCitizen, desc: labels.priorityCitizenDesc },
    { value: "PREGNANT", label: labels.priorityPregnant, desc: labels.priorityPregnantDesc },
  ];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: name,
        phone: channel === "SMS" ? phone : "",
        email: channel === "EMAIL" ? email : "",
        channel,
        priorityType,
        reason,
        locale,
      }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Request failed" }));
      setError(body.error ?? "Request failed");
      toast.error(body.error ?? "Request failed");
      return;
    }
    const { ticket } = await res.json();
    toast.success(`Ticket ${ticket.number} created`, {
      description: "We'll notify you when it's almost your turn.",
    });
    router.push(`/q/${ticket.number}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{labels.title}</CardTitle>
        <p className="text-sm text-slate-500">{labels.subtitle}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{labels.name}</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={labels.namePlaceholder}
              required
              className="h-12 text-base"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium mb-1">{labels.channel}</legend>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                  channel === "SMS"
                    ? "border-blue-700 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="channel"
                  value="SMS"
                  checked={channel === "SMS"}
                  onChange={() => setChannel("SMS")}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{labels.channelSms}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{labels.channelSmsDesc}</p>
              </label>
              <label
                className={`rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                  channel === "EMAIL"
                    ? "border-blue-700 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="channel"
                  value="EMAIL"
                  checked={channel === "EMAIL"}
                  onChange={() => setChannel("EMAIL")}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{labels.channelEmail}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{labels.channelEmailDesc}</p>
              </label>
            </div>
          </fieldset>

          {channel === "SMS" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{labels.phone}</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+639171234567"
                required
                className="h-12 text-base"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{labels.email}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aling.maria@example.com"
                required
                className="h-12 text-base"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">{labels.reason}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={labels.reasonPlaceholder}
              rows={3}
              maxLength={500}
              className="text-base resize-none"
            />
            <p className="text-xs text-slate-500 -mt-1">
              {labels.reasonHelp}
              {reason.length > 0 && (
                <span className="float-right tabular">{reason.length}/500</span>
              )}
            </p>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium mb-1">{labels.priority}</legend>
            <div className="grid grid-cols-2 gap-2">
              {priorities.map((p) => (
                <label
                  key={p.value}
                  className={`rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                    priorityType === p.value
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="priorityType"
                    value={p.value}
                    checked={priorityType === p.value}
                    onChange={(e) => setPriorityType(e.target.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-slate-500">{p.desc}</p>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              aria-live="polite"
              className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2"
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
            {pending ? labels.submitting : labels.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
