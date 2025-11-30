import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const unidades = [
    'metros',
    'centimetros',
    'milimetros',
    'calibre',
    'm2',
    'cm2',
    'psi',
    'mpa',
    'NO APLICA',
  ];

  for (const nombre of unidades) {
    await prisma.unidad.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  console.log('✅ Unidades base creadas correctamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
