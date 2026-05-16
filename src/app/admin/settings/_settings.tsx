"use client";

import { useEffect, useState, FormEvent } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Setting = { key: string; value: string };

const PROTECTED_KEYS = new Set(["clinic_name", "default_consultation_minutes"]);

const KEY_HELP: Record<string, string> = {
  clinic_name: "Displayed in headers and messages.",
  default_consultation_minutes:
    "Used as the wait estimate when there isn't enough completed-ticket history yet.",
};

export function SettingsAdmin() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Setting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      setDrafts(Object.fromEntries(data.settings.map((s: Setting) => [s.key, s.value])));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(key: string) {
    setSaving(key);
    setError(null);
    const res = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: drafts[key] ?? "" }),
    });
    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Save failed" }));
      setError(data.error ?? "Save failed");
      toast.error(data.error ?? "Save failed");
      return;
    }
    setSavedAt(key);
    toast.success(`Saved ${key}`);
    setTimeout(() => setSavedAt(null), 2500);
    load();
  }

  async function remove(s: Setting) {
    const res = await fetch(`/api/admin/settings/${encodeURIComponent(s.key)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Delete failed" }));
      setError(data.error ?? "Delete failed");
      toast.error(data.error ?? "Delete failed");
      return;
    }
    setDeleting(null);
    toast.success(`Removed ${s.key}`);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-sm text-slate-500">
            Configure clinic-wide values. Changes apply instantly.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="cursor-pointer">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add setting
        </Button>
      </header>

      {error && (
        <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.map((s) => {
          const dirty = drafts[s.key] !== s.value;
          const isProtected = PROTECTED_KEYS.has(s.key);
          return (
            <Card key={s.key}>
              <CardContent className="pt-6 flex flex-col gap-3">
                <div>
                  <Label htmlFor={`setting-${s.key}`} className="font-mono">
                    {s.key}
                  </Label>
                  {KEY_HELP[s.key] && (
                    <p className="text-xs text-slate-500 mt-1">{KEY_HELP[s.key]}</p>
                  )}
                </div>
                <Input
                  id={`setting-${s.key}`}
                  value={drafts[s.key] ?? ""}
                  onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                  className="h-11 text-base"
                />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    onClick={() => save(s.key)}
                    disabled={!dirty || saving === s.key}
                    className="cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    {saving === s.key ? "Saving…" : savedAt === s.key ? "Saved ✓" : "Save"}
                  </Button>
                  {!isProtected && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleting(s)}
                      className="text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateSettingDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          load();
        }}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete setting?</DialogTitle>
            <DialogDescription>
              Permanently remove{" "}
              <span className="font-mono">{deleting?.key}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={() => deleting && remove(deleting)}
              className="bg-rose-600 hover:bg-rose-700 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateSettingDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Create failed" }));
      setError(data.error ?? "Create failed");
      toast.error(data.error ?? "Create failed");
      return;
    }
    toast.success(`Added ${key}`);
    setKey("");
    setValue("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add setting</DialogTitle>
          <DialogDescription>Use lowercase letters and underscores (e.g. <span className="font-mono">max_queue_size</span>).</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="setting-key">Key</Label>
            <Input
              id="setting-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. max_queue_size"
              required
              pattern="[a-z0-9_]+"
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="setting-value">Value</Label>
            <Input
              id="setting-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="cursor-pointer">
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
