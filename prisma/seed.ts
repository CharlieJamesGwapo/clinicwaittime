import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const nursePw = await bcrypt.hash("nurse123", 10);
  const adminPw = await bcrypt.hash("admin123", 10);

  await db.user.upsert({
    where: { email: "nurse@clinic.test" },
    update: { passwordHash: nursePw, role: "STAFF" },
    create: { email: "nurse@clinic.test", passwordHash: nursePw, role: "STAFF" },
  });

  await db.user.upsert({
    where: { email: "admin@clinic.test" },
    update: { passwordHash: adminPw, role: "ADMIN" },
    create: { email: "admin@clinic.test", passwordHash: adminPw, role: "ADMIN" },
  });

  await db.setting.upsert({
    where: { key: "clinic_name" },
    update: { value: "Barangay Health Center — Demo" },
    create: { key: "clinic_name", value: "Barangay Health Center — Demo" },
  });

  await db.setting.upsert({
    where: { key: "default_consultation_minutes" },
    update: { value: "15" },
    create: { key: "default_consultation_minutes", value: "15" },
  });

  console.log("Seeded: 2 users, 2 settings");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
