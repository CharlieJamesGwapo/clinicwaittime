import { db } from "@/lib/db";
import { sendEmail, splitEmailMessage, isEmailConfigured } from "@/lib/email";
import type { Channel } from "@/lib/types";

export async function writeNotification(input: {
  ticketId: string;
  channel: Channel;
  recipient: string;
  message: string;
}): Promise<void> {
  // Always log to SmsLog so the simulated inbox panel keeps working as a
  // demo aid AND as an audit trail of every notification.
  await db.smsLog.create({
    data: {
      ticketId: input.ticketId,
      channel: input.channel,
      recipient: input.recipient,
      phone: input.recipient,
      message: input.message,
    },
  });

  // If the channel is EMAIL and Resend is configured, also send a real email.
  // Failures are logged but don't break the queue flow — the patient still
  // sees the message in the simulated inbox and the in-app status page.
  if (input.channel === "EMAIL" && isEmailConfigured() && input.recipient.includes("@")) {
    const { subject, body } = splitEmailMessage(input.message);
    void sendEmail({ to: input.recipient, subject, body });
  }
}

// Back-compat alias for the legacy writeSmsLog signature.
export async function writeSmsLog(input: {
  ticketId: string;
  phone: string;
  message: string;
  channel?: Channel;
}): Promise<void> {
  await writeNotification({
    ticketId: input.ticketId,
    channel: input.channel ?? "SMS",
    recipient: input.phone,
    message: input.message,
  });
}
