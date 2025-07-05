import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plainPassword = "password123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: "vaskar@admin.com",
      name: "vaskar",
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log("Admin user created:", admin, plainPassword);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
console.log("yet test");
