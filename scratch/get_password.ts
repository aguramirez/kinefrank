import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const franco = await prisma.admin.findUnique({
    where: { username: 'franco' }
  });
  if (franco) {
    console.log('Franco password:', franco.password);
  } else {
    console.log('Franco admin not found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
