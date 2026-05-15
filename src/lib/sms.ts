import { db } from "@/lib/db";

export async function writeSmsLog(input: {
  ticketId: string;
  phone: string;
  message: string;
}): Promise<void> {
  await db.smsLog.create({
    data: {
      ticketId: input.ticketId,
      phone: input.phone,
      message: input.message,
    },
  });
}
