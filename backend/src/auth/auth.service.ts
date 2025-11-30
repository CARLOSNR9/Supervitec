import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ================================================================
  // VALIDAR USUARIO PARA LOGIN
  // ================================================================
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña incorrecta.');
    }

    // Retornar datos sin el hash
    const { hash: _, ...result } = user;
    return result;
  }

  // ================================================================
  // GENERAR TOKEN
  // ================================================================
  async login(user: any) {
    // Construimos payload del JWT con la info necesaria del negocio
    const payload = {
      sub: user.id,            // userId
      username: user.username,
      role: user.role,

      // NUEVO ➜ información para negocio SaaS
      ownerDirectorId: user.ownerDirectorId ?? null,
      maxUsers: user.maxUsers ?? null,
      maxObras: user.maxObras ?? null,
    };

    return {
      access_token: this.jwtService.sign(payload),

      // Datos que el frontend necesita inmediatamente
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        ownerDirectorId: user.ownerDirectorId ?? null,
        maxUsers: user.maxUsers ?? null,
        maxObras: user.maxObras ?? null,
      },
    };
  }
}
