import { UserStatus } from "@/lib/generated/userEnums";
import { UserRole } from "@/lib/generated/userRoles";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ADMIN test account
  const adminHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "bhaskar@golicit.in" },
    update: {},
    create: {
      name: "Bhaskar Gayen",
      email: "bhaskar@golicit.in",
      phone: "783279197",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // THERAPIST test account
  const therapistHash = await bcrypt.hash("therapist123", 10);
  await prisma.user.upsert({
    where: { email: "therapist@test.in" },
    update: {},
    create: {
      name: "Test Therapist",
      email: "therapist@test.in",
      passwordHash: therapistHash,
      role: UserRole.THERAPIST,
      status: UserStatus.ACTIVE,
    },
  });

  // RECEPTIONIST test account
  const receptionistHash = await bcrypt.hash("receptionist", 10);
  await prisma.user.upsert({
    where: { email: "receptionist@test.in" },
    update: {},
    create: {
      name: "Test Receptionist",
      email: "receptionist@test.in",
      passwordHash: receptionistHash,
      role: UserRole.RECEPTIONIST,
      status: UserStatus.ACTIVE,
    },
  });

  // CONTENT_MANAGER test account
  const contentHash = await bcrypt.hash("content123", 10);
  await prisma.user.upsert({
    where: { email: "content@test.in" },
    update: {},
    create: {
      name: "Test Content Manager",
      email: "content@test.in",
      passwordHash: contentHash,
      role: UserRole.CONTENT_MANAGER,
      status: UserStatus.ACTIVE,
    },
  });

  // Seed Indian national holidays for 2025 and 2026
  const indianHolidays = [
    // 2025 holidays
    { date: new Date("2025-01-26"), name: "Republic Day" },
    { date: new Date("2025-03-14"), name: "Holi" },
    { date: new Date("2025-04-14"), name: "Dr. Ambedkar Jayanti" },
    { date: new Date("2025-04-18"), name: "Good Friday" },
    { date: new Date("2025-05-12"), name: "Buddha Purnima" },
    { date: new Date("2025-08-15"), name: "Independence Day" },
    { date: new Date("2025-10-02"), name: "Gandhi Jayanti" },
    { date: new Date("2025-10-02"), name: "Dussehra" },
    { date: new Date("2025-10-20"), name: "Diwali (Lakshmi Puja)" },
    { date: new Date("2025-11-05"), name: "Guru Nanak Jayanti" },
    { date: new Date("2025-12-25"), name: "Christmas Day" },
    // 2026 holidays
    { date: new Date("2026-01-26"), name: "Republic Day" },
    { date: new Date("2026-03-03"), name: "Holi" },
    { date: new Date("2026-03-20"), name: "Good Friday" },
    { date: new Date("2026-04-14"), name: "Dr. Ambedkar Jayanti" },
    { date: new Date("2026-05-31"), name: "Buddha Purnima" },
    { date: new Date("2026-08-15"), name: "Independence Day" },
    { date: new Date("2026-10-02"), name: "Gandhi Jayanti" },
    { date: new Date("2026-11-14"), name: "Diwali (Lakshmi Puja)" },
    { date: new Date("2026-11-25"), name: "Guru Nanak Jayanti" },
    { date: new Date("2026-12-25"), name: "Christmas Day" },
  ];

  for (const holiday of indianHolidays) {
    const existing = await prisma.holiday.findFirst({
      where: { date: holiday.date, name: holiday.name },
    });
    if (!existing) {
      await prisma.holiday.create({
        data: {
          date: holiday.date,
          name: holiday.name,
          isRecurring: false,
        },
      });
    }
  }

  console.log("🌱 Seed data inserted successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
