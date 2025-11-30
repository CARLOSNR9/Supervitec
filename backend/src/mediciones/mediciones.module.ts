import { Module } from '@nestjs/common';
import { MedicionesService } from './mediciones.service';
import { MedicionesController } from './mediciones.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MedicionesController],
  providers: [MedicionesService],
  exports: [MedicionesService],
})
export class MedicionesModule {}
