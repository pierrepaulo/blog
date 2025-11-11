import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? "usuario@teste.com";
  const name = process.env.SEED_USER_NAME ?? "Usuario Teste";
  const password = process.env.SEED_USER_PASSWORD ?? "usuario123";
  const passwordHash = bcrypt.hashSync(password);

  const existingUser = await prisma.user.findFirst({
    where: { email },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: { name, password: passwordHash, status: true },
      })
    : await prisma.user.create({
        data: { name, email, password: passwordHash, status: true },
      });

  console.log(`Seed user ready (id: ${user.id}, email: ${user.email})`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
