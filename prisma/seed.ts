import { UserStatus } from "@/lib/generated/userEnums";
import { UserRole } from "@/lib/generated/userRoles";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const plainPassword = "password123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  await prisma.user.create({
    data: {
      name: "Bhaskar Gayen",
      email: "bhaskar@golicit.in",
      phone: "783279197",
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
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
