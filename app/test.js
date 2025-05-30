import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const plainPassword = "password123"
  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  const admin = await prisma.user.create({
    data: {
      email: "vaskar@admin.com",
      name: "vaskar",
      passwordHash: hashedPassword,
      role: "admin", // or whatever your role field uses
    },
  })

  console.log("✅ Admin user created:", admin)
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())
console.log("yet test")