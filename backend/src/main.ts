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
    origin: process.env.FRONTEND_ORIGIN || '*', // para Render, mejor por env
    methods: 'GET,POST,PATCH,DELETE,PUT,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // ================================
  // 📁 SERVIR ARCHIVOS ESTÁTICOS
  // ================================
  // Con esto podrás acceder a:
  // http://localhost:3001/uploads/bitacoras/foto.jpg
  // y en Render: https://tu-app.onrender.com/uploads/...
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
  // 🚀 LEVANTAR SERVIDOR (clave para Render)
  // ================================
  const port = process.env.PORT || 3001; // Render inyecta PORT
  await app.listen(port, '0.0.0.0');     // escuchar en todas las interfaces
  console.log(`Aplicación ejecutándose en: ${await app.getUrl()}`);
}

bootstrap();
