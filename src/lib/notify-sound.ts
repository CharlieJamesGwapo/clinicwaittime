/**
 * Lightweight chime synthesized in WebAudio so we don't ship any audio asset.
 * Two-note up-down "ding-dong" pleasant enough for a clinic context.
 */
export function playChime(): void {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [
      { freq: 880, start: 0, dur: 0.22 }, // A5
      { freq: 659.25, start: 0.18, dur: 0.32 }, // E5
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = n.freq;
      gain.gain.setValueAtTime(0, now + n.start);
      gain.gain.linearRampToValueAtTime(0.18, now + n.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    }
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    /* audio blocked — ignore */
  }
}

export async function showCalledNotification(ticketNumber: string): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  try {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission !== "granted") return;
    new Notification("It's your turn", {
      body: `Ticket ${ticketNumber} — please head to the consultation room.`,
      tag: `ticket-${ticketNumber}`,
      requireInteraction: false,
    });
  } catch {
    /* notification blocked — ignore */
  }
}

export function requestNotificationPermission(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}
