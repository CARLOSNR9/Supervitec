// Archivo: backend/src/auth/auth.module.ts (COMPLETO Y CORREGIDO)

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './jwt-auth.guard'; // 🚀 Importar el Guard

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supervitec_secret_key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy,
    JwtAuthGuard // 🚀 1. Añadir el Guard como proveedor
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtAuthGuard // 🚀 2. Exportar el Guard para que App, Obras, etc., lo usen
  ],
})
export class AuthModule {}