import { Module } from '@nestjs/common';
import { ContratistasService } from './contratistas.service';
import { ContratistasController } from './contratistas.controller';
import { PrismaService } from '../prisma/prisma.service'; // Necesario para el servicio

@Module({
  imports: [],
  controllers: [ContratistasController],
  providers: [ContratistasService, PrismaService],
  exports: [ContratistasService], // Exportamos para que otros módulos (como Bitácoras) lo usen si es necesario
})
export class ContratistasModule {}