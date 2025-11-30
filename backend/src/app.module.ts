// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos base
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

// Módulos funcionales
import { ObrasModule } from './obras/obras.module';
import { OrdenTrabajoModule } from './orden-trabajo/orden-trabajo.module';
import { BitacorasModule } from './bitacoras/bitacoras.module';
import { ContratistasModule } from './contratistas/contratistas.module';
import { VariablesModule } from './variables/variables.module'; 
import { MedicionesModule } from './mediciones/mediciones.module'; 
import { UnidadesModule } from './unidades/unidades.module';

// 📦 Módulo Multer (para manejo de archivos)
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

@Module({
  imports: [
    // --- BASE DE DATOS Y AUTENTICACIÓN ---
    PrismaModule,
    AuthModule,
    UsersModule,

    // --- MÓDULOS FUNCIONALES ---
    ObrasModule,
    OrdenTrabajoModule,
    BitacorasModule,
    ContratistasModule,
    VariablesModule,
    MedicionesModule, 
    UnidadesModule,

    // --- MULTER: CONFIGURACIÓN GLOBAL PARA SUBIDA DE ARCHIVOS ---
    MulterModule.register({
      storage: diskStorage({
        destination: join(__dirname, '..', 'uploads'), // 📁 Guardará los archivos en /uploads
        filename: (req, file, cb) => {
          // Crea nombres únicos para evitar colisiones
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const cleanName = file.originalname.replace(/\s+/g, '_');
          cb(null, `${uniqueSuffix}-${cleanName}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 🔒 Máximo 5 MB por imagen
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
