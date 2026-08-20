import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.ejercicio.findMany();
  console.log('Total exercises:', exercises.length);
  const withVideo = exercises.filter(e => e.videoUrl);
  console.log('Exercises with video:', withVideo.length);
  const youtube = exercises.filter(e => e.videoUrl && (e.videoUrl.includes('youtube.com') || e.videoUrl.includes('youtu.be')));
  console.log('Exercises with YouTube video:', youtube.length);
  const others = exercises.filter(e => e.videoUrl && !e.videoUrl.includes('youtube.com') && !e.videoUrl.includes('youtu.be'));
  console.log('Exercises with other video URLs:', others.length);
  if (others.length > 0) {
    console.log('Examples of other video URLs:');
    others.slice(0, 5).forEach(e => console.log(`- Name: ${e.name}, URL: ${e.videoUrl}`));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
