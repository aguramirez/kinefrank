import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany();
  console.log('Admins:');
  admins.forEach(a => {
    console.log(`- Username: ${a.username}, Email: ${a.email}, FullName: ${a.fullName}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
