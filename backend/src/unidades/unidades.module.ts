import { Module } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { UnidadesController } from './unidades.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UnidadesController],
  providers: [UnidadesService, PrismaService],
})
export class UnidadesModule {}
