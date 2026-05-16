export interface QueuedAction {
  id: string;
  path: string;
  body?: unknown;
  queuedAt: number;
}

const KEY = "clinic.offline.actions.v1";

function read(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
  } catch {
    return [];
  }
}

function write(actions: QueuedAction[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(actions));
}

export function enqueue(action: Omit<QueuedAction, "id" | "queuedAt">): QueuedAction[] {
  const all = read();
  all.push({ ...action, id: crypto.randomUUID(), queuedAt: Date.now() });
  write(all);
  return all;
}

export function list(): QueuedAction[] {
  return read();
}

export function clear(): void {
  write([]);
}

export async function replay(): Promise<{ ok: number; failed: number }> {
  const all = read();
  let ok = 0;
  let failed = 0;
  for (const a of all) {
    try {
      const res = await fetch(a.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: a.body ? JSON.stringify(a.body) : undefined,
      });
      if (res.ok) ok += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  clear();
  return { ok, failed };
}
