// 📄 Archivo: src/main.ts

// 🚀 DEBE SER LA PRIMERA LÍNEA
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // ⭐ NECESARIO PARA SERVIR ARCHIVOS ESTÁTICOS
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ================================
  // 🌍 CORS
  // ================================
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PATCH,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // ================================
  // 📁 SERVIR ARCHIVOS ESTÁTICOS
  // ================================
  // KEY: Aquí se sirven las fotos de /uploads
  //
  // Con esto podrás acceder a:
  // http://localhost:3001/uploads/bitacoras/foto.jpg
  //
  // IMPORTANT: process.cwd() funciona perfecto
  // en ambientes Nest + TS
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // ================================
  // 🔐 VALIDACIÓN GLOBAL
  // ================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ================================
  // 🚀 LEVANTAR SERVIDOR
  // ================================
  await app.listen(3001);
  console.log(`Aplicación ejecutándose en: ${await app.getUrl()}`);
}

bootstrap();
