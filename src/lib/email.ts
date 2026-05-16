import { Resend } from "resend";

const FROM = process.env.RESEND_FROM || "Clinic Wait-Time <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Send a real email via Resend. Returns true on success, false on failure or
 * when Resend isn't configured. Errors are logged but never thrown — the
 * caller (notification stack) always still writes to SmsLog so the simulated
 * inbox panel keeps working even if real delivery fails.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getClient();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });
    if (error) {
      console.error("resend send error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("resend exception", err);
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Helper: split a notification body of the form "Subject: X\n\nBody..." into
 * its subject and body. Matches the convention from renderNotification().
 */
export function splitEmailMessage(message: string): { subject: string; body: string } {
  const m = message.match(/^Subject:\s*(.+?)\n\n([\s\S]*)$/);
  if (!m) return { subject: "Clinic update", body: message };
  return { subject: m[1].trim(), body: m[2] };
}
