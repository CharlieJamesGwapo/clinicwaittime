import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function maskRecipient(value: string): string {
  if (!value) return "";
  if (value.includes("@")) {
    const [user, domain] = value.split("@");
    if (!user) return `@${domain}`;
    const head = user.slice(0, 2);
    return `${head}${user.length > 2 ? "•".repeat(Math.max(2, user.length - 2)) : ""}@${domain}`;
  }
  if (value.length <= 4) return "••" + value;
  return value.slice(0, 4) + "•".repeat(Math.max(2, value.length - 7)) + value.slice(-3);
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isStaff = role === "STAFF" || role === "ADMIN";

  const rows = await db.smsLog.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
    include: { ticket: { select: { number: true } } },
  });

  return NextResponse.json({
    messages: rows.map((r) => {
      const recipient = r.recipient || r.phone;
      return {
        id: r.id,
        ticketNumber: r.ticket.number,
        channel: r.channel || "SMS",
        recipient: isStaff ? recipient : maskRecipient(recipient),
        phone: isStaff ? r.phone : maskRecipient(r.phone),
        message: r.message,
        sentAt: r.sentAt,
      };
    }),
  });
}
