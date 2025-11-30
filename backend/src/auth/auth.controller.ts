// Archivo: backend/src/auth/auth.controller.ts

import { Controller, Post, Body, UnauthorizedException, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * LOGIN
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.authService.validateUser(username, password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    return this.authService.login(user);
  }

  /**
   * 🟩 NUEVO ENDPOINT PARA OBTENER USUARIO LOGUEADO
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    // req.user es asignado por jwt-auth.guard.ts
    return req.user;
  }
}
