/**
 * Subscribe to queue_updated events with automatic fallback to polling.
 *
 * On Vercel's serverless runtime the in-memory event bus only propagates
 * within a single function instance. After a cold start or when two clients
 * land on different instances, EventSource never receives a queue_updated.
 * We start with SSE (instant, ~250ms debounced) and only flip to 5s polling
 * after three errors or an explicit CLOSED state, so single-instance demos
 * stay fast while multi-instance prod still updates within ~5s.
 */
export function subscribeQueueUpdates(onChange: () => void): () => void {
  let es: EventSource | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let cancelled = false;
  let consecutiveErrors = 0;

  const startPolling = () => {
    if (cancelled || pollTimer !== null) return;
    pollTimer = setInterval(onChange, 5000);
  };

  const startSse = () => {
    if (cancelled || typeof EventSource === "undefined") {
      startPolling();
      return;
    }
    try {
      es = new EventSource("/api/queue/stream");
      es.addEventListener("ready", () => {
        consecutiveErrors = 0;
        onChange();
      });
      es.addEventListener("queue_updated", () => onChange());
      es.addEventListener("error", () => {
        consecutiveErrors += 1;
        if (es?.readyState === EventSource.CLOSED || consecutiveErrors >= 3) {
          es?.close();
          es = null;
          startPolling();
        }
      });
    } catch {
      startPolling();
    }
  };

  // Initial fetch so the caller has data without waiting for an event.
  onChange();
  startSse();

  return () => {
    cancelled = true;
    es?.close();
    if (pollTimer !== null) clearInterval(pollTimer);
  };
}
