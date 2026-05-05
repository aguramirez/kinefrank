import prisma from './prisma';

export async function checkExpirations() {
  const now = new Date();
  
  // Handle Pacientes
  const patientsToExpire = await prisma.paciente.findMany({
    where: {
      isActive: true,
      expirationDate: {
        lte: now
      }
    }
  });

  for (const p of patientsToExpire) {
    await prisma.paciente.update({
      where: { id: p.id },
      data: {
        isActive: false,
        dischargeDate: p.expirationDate || now
      }
    });
  }

  // Handle Alumnos
  const alumnosToExpire = await prisma.alumno.findMany({
    where: {
      isActive: true,
      expirationDate: {
        lte: now
      }
    }
  });

  for (const a of alumnosToExpire) {
    await prisma.alumno.update({
      where: { id: a.id },
      data: {
        isActive: false,
        dischargeDate: a.expirationDate || now
      }
    });
  }
}
