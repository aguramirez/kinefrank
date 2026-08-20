import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const exercise = await prisma.ejercicio.findFirst({
    where: {
      videoUrl: { not: null }
    }
  });

  if (!exercise) {
    console.log('No exercise with videoUrl found');
    return;
  }

  console.log(`Original: ${exercise.videoUrl}`);

  // Test 1: Update with null directly
  let updated = await prisma.ejercicio.update({
    where: { id: exercise.id },
    data: {
      videoUrl: null
    }
  });
  console.log(`After null update: ${updated.videoUrl}`);

  // Test 2: Restore
  updated = await prisma.ejercicio.update({
    where: { id: exercise.id },
    data: {
      videoUrl: exercise.videoUrl
    }
  });
  console.log(`Restored: ${updated.videoUrl}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
