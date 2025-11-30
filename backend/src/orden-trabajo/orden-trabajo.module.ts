// src/orden-trabajo/orden-trabajo.module.ts
import { Module } from '@nestjs/common';
import { OrdenTrabajoService } from './orden-trabajo.service';
import { OrdenTrabajoController } from './orden-trabajo.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [OrdenTrabajoController],
  providers: [OrdenTrabajoService, PrismaService],
})
export class OrdenTrabajoModule {}
