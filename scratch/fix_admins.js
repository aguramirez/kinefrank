const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    console.log('No admin found.');
    return;
  }
  console.log('Using Admin ID:', admin.id);

  const updatedPacientes = await prisma.paciente.updateMany({
    where: { adminId: null },
    data: { adminId: admin.id }
  });
  console.log('Updated Pacientes:', updatedPacientes.count);

  const updatedAlumnos = await prisma.alumno.updateMany({
    where: { adminId: null },
    data: { adminId: admin.id }
  });
  console.log('Updated Alumnos:', updatedAlumnos.count);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
