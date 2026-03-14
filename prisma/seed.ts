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
