import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando tabla User...');
  await prisma.user.deleteMany();

  const users = [
    { 
      username: 'admin', 
      password: 'adminpassword', 
      nombreCompleto: 'Administrador Principal', // 🚀 AÑADIDO
      role: Role.ADMIN 
    },
    { 
      username: 'supervisor', 
      password: 'supervisorpassword', 
      nombreCompleto: 'Supervisor de Obra', // 🚀 AÑADIDO
      role: Role.SUPERVISOR 
    },
    { 
      username: 'residente', 
      password: 'residente123', 
      nombreCompleto: 'Residente de Obra', // 🚀 AÑADIDO
      role: Role.RESIDENTE 
    },
    { 
      username: 'visitante', 
      password: 'visitante123', 
      nombreCompleto: 'Usuario Visitante', // 🚀 AÑADIDO
      role: Role.VISITANTE 
    },
  ];

  for (const u of users) {
    // Generamos el hash de la contraseña antes de crear el usuario
    const userHash = await bcrypt.hash(u.password, 10);
    
    await prisma.user.create({
      data: {
        username: u.username,
        hash: userHash,
        nombreCompleto: u.nombreCompleto, // 🚀 INCLUIDO EN LA CREACIÓN
        role: u.role,
        active: true,
      },
    });
  }

  console.log('✅ Usuarios creados exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });