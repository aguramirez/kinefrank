const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany();
  console.log('Admins:', JSON.stringify(admins, null, 2));
  const pacientes = await prisma.paciente.findMany({ select: { id: true, fullName: true, adminId: true } });
  console.log('Pacientes:', JSON.stringify(pacientes, null, 2));
  const alumnos = await prisma.alumno.findMany({ select: { id: true, fullName: true, adminId: true } });
  console.log('Alumnos:', JSON.stringify(alumnos, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
