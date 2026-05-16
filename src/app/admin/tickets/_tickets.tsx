"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { Search, Pencil, Trash2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  PRIORITY_TYPES,
  TICKET_STATUSES,
  type PriorityType,
  type TicketStatus,
} from "@/lib/types";
import { PriorityBadge, StatusBadge } from "@/lib/labels";

type Ticket = {
  id: string;
  number: string;
  patientName: string;
  phone: string;
  email: string | null;
  channel: string;
  priorityType: PriorityType;
  status: TicketStatus;
  reason: string | null;
  createdAt: string;
  calledAt: string | null;
  completedAt: string | null;
};

const PAGE_SIZE = 25;

export function TicketsAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (statusFilter) p.set("status", statusFilter);
    if (priorityFilter) p.set("priority", priorityFilter);
    if (channelFilter) p.set("channel", channelFilter);
    p.set("take", String(PAGE_SIZE));
    p.set("skip", String(page * PAGE_SIZE));
    return p.toString();
  }, [q, statusFilter, priorityFilter, channelFilter, page]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/tickets?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets);
      setTotal(data.total);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    setPage(0);
  }, [q, statusFilter, priorityFilter, channelFilter]);

  async function remove(t: Ticket) {
    const res = await fetch(`/api/admin/tickets/${t.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Delete failed" }));
      setError(data.error ?? "Delete failed");
      return;
    }
    setDeleting(null);
    load();
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Tickets</h2>
          <p className="text-sm text-slate-500">
            {total} total — search, filter, edit, or delete any ticket.
          </p>
        </div>
        <Button variant="outline" onClick={() => load()} className="cursor-pointer">
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </header>

      {error && (
        <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="ticket-search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input
                  id="ticket-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search number, name, phone, email…"
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border bg-white px-3 text-sm cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 rounded-md border bg-white px-3 text-sm cursor-pointer"
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              {PRIORITY_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap text-xs">
            <button
              onClick={() => setChannelFilter("")}
              className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${channelFilter === "" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50"}`}
            >
              All channels
            </button>
            <button
              onClick={() => setChannelFilter("SMS")}
              className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${channelFilter === "SMS" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50"}`}
            >
              SMS
            </button>
            <button
              onClick={() => setChannelFilter("EMAIL")}
              className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${channelFilter === "EMAIL" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50"}`}
            >
              Email
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-slate-500 py-8">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-slate-500 py-8">
                    No tickets match.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono">{t.number}</TableCell>
                    <TableCell>
                      <div className="font-medium">{t.patientName}</div>
                      <div className="text-xs text-slate-500">
                        {t.channel === "EMAIL" ? t.email : t.phone}
                      </div>
                      {t.reason && (
                        <div
                          className="text-xs text-slate-500 mt-1 max-w-[24ch] truncate"
                          title={t.reason}
                        >
                          {t.reason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs uppercase tracking-wider text-slate-500">
                      {t.channel}
                    </TableCell>
                    <TableCell>
                      {t.priorityType === "NONE" ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <PriorityBadge priorityType={t.priorityType} />
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(t)}
                        className="cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleting(t)}
                        className="text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="cursor-pointer"
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <EditTicketDialog
        ticket={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete ticket?</DialogTitle>
            <DialogDescription>
              Permanently remove ticket{" "}
              <span className="font-mono">{deleting?.number}</span> for{" "}
              <span className="font-medium">{deleting?.patientName}</span> and all of its
              notification log entries.
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

function EditTicketDialog({
  ticket,
  onClose,
  onSaved,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [patientName, setPatientName] = useState(ticket?.patientName ?? "");
  const [phone, setPhone] = useState(ticket?.phone ?? "");
  const [email, setEmail] = useState(ticket?.email ?? "");
  const [reason, setReason] = useState(ticket?.reason ?? "");
  const [priorityType, setPriorityType] = useState<PriorityType>(ticket?.priorityType ?? "NONE");
  const [status, setStatus] = useState<TicketStatus>(ticket?.status ?? "WAITING");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ticket) {
      setPatientName(ticket.patientName);
      setPhone(ticket.phone);
      setEmail(ticket.email ?? "");
      setReason(ticket.reason ?? "");
      setPriorityType(ticket.priorityType);
      setStatus(ticket.status);
      setError(null);
    }
  }, [ticket]);

  if (!ticket) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ticket) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientName, phone, email, reason, priorityType, status }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Update failed" }));
      setError(data.error ?? "Update failed");
      return;
    }
    onSaved();
  }

  return (
    <Dialog open={!!ticket} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit ticket {ticket.number}</DialogTitle>
          <DialogDescription>Changes broadcast to all live surfaces.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="t-name">Patient name</Label>
            <Input id="t-name" value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="t-phone">Phone</Label>
              <Input id="t-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="t-email">Email</Label>
              <Input id="t-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="t-reason">Reason for visit</Label>
            <Textarea
              id="t-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="t-priority">Priority</Label>
              <select
                id="t-priority"
                value={priorityType}
                onChange={(e) => setPriorityType(e.target.value as PriorityType)}
                className="h-9 rounded-md border bg-white px-3 text-sm cursor-pointer"
              >
                {PRIORITY_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="t-status">Status</Label>
              <select
                id="t-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="h-9 rounded-md border bg-white px-3 text-sm cursor-pointer"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
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
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
