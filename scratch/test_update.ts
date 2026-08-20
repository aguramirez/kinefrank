import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find an exercise with a videoUrl
  const exercise = await prisma.ejercicio.findFirst({
    where: {
      videoUrl: { not: null }
    }
  });

  if (!exercise) {
    console.log('No exercise with videoUrl found');
    return;
  }

  console.log(`Original exercise: ${exercise.name}, videoUrl: ${exercise.videoUrl}`);

  // Simulate payload where videoUrl is null
  const payload = {
    name: exercise.name,
    description: exercise.description,
    categories: exercise.categories,
    videoUrl: null
  };

  // Perform update
  const updated = await prisma.ejercicio.update({
    where: { id: exercise.id },
    data: {
      name: payload.name,
      description: payload.description,
      categories: payload.categories,
      videoUrl: payload.videoUrl ?? undefined,
    }
  });

  console.log(`Updated exercise: ${updated.name}, videoUrl: ${updated.videoUrl}`);

  // Restore it back so we don't break the data
  await prisma.ejercicio.update({
    where: { id: exercise.id },
    data: {
      videoUrl: exercise.videoUrl
    }
  });
  console.log('Restored original videoUrl');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
