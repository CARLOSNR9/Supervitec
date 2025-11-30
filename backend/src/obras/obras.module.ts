// Archivo: backend/src/obras/obras.module.ts (Completo)

import { Module } from '@nestjs/common';
import { ObrasService } from './obras.service';
import { ObrasController } from './obras.controller';
import { PrismaService } from '../prisma/prisma.service'; // Importar PrismaService

@Module({
  // 🚀 Asegúrate de que tu controlador esté listado
  controllers: [ObrasController],
  // 🚀 Asegúrate de que tu servicio y PrismaService estén listados
  providers: [ObrasService, PrismaService],
  imports: [],
})
export class ObrasModule {}