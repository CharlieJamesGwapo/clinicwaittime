-- AlterTable
ALTER TABLE "SmsLog" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'SMS',
ADD COLUMN     "recipient" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'SMS',
ADD COLUMN     "email" TEXT;
