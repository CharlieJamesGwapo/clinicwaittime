import { subscribeQueue } from "@/lib/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let keepalive: ReturnType<typeof setInterval> | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      enqueue("event: ready\ndata: {}\n\n");

      const send = () => enqueue("event: queue_updated\ndata: {}\n\n");

      const debouncedSend = () => {
        if (debounceTimer) return;
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          send();
        }, 250);
      };

      unsubscribe = subscribeQueue(debouncedSend);

      keepalive = setInterval(() => enqueue(": keepalive\n\n"), 30000);
    },
    cancel() {
      closed = true;
      unsubscribe?.();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (keepalive) clearInterval(keepalive);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
