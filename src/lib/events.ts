type Listener = () => void;

const listeners = new Set<Listener>();

export function emitQueueUpdated(): void {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* dead listener — caller is expected to unsubscribe on its own teardown */
    }
  }
}

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
