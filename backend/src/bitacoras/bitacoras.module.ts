import { Module } from '@nestjs/common';
import { BitacorasService } from './bitacoras.service';
import { BitacorasController } from './bitacoras.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module'; // 👈 IMPORTANTE

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule, // 👈 AGREGAR ESTA LÍNEA
  ],
  controllers: [BitacorasController],
  providers: [BitacorasService],
})
export class BitacorasModule {}