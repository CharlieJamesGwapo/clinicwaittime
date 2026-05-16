import { db } from "@/lib/db";
import type { Channel } from "@/lib/types";

export async function writeNotification(input: {
  ticketId: string;
  channel: Channel;
  recipient: string;
  message: string;
}): Promise<void> {
  await db.smsLog.create({
    data: {
      ticketId: input.ticketId,
      channel: input.channel,
      recipient: input.recipient,
      phone: input.recipient,
      message: input.message,
    },
  });
}

// Back-compat alias for existing callers; defaults to SMS channel.
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
