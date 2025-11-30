import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { BitacorasService } from './bitacoras.service';
import { BitacorasController } from './bitacoras.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads', 'bitacoras'),
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
          cb(null, unique);
        },
      }),
    }),
  ],
  controllers: [BitacorasController],
  providers: [BitacorasService, PrismaService],
  exports: [BitacorasService],
})
export class BitacorasModule {}
