// backend/src/auth/jwt-auth.guard.ts

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  // 👇 FIRMA CORRECTA para evitar TS2416
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o inexistente');
    }

    // `user` aquí es el payload que devolvió JwtStrategy (con sub, username, role, etc.)
    const normalizedUser = {
      userId: user.sub ?? user.userId ?? user.id,
      username: user.username,
      role: user.role,
      ownerDirectorId: user.ownerDirectorId ?? null,
      maxUsers: user.maxUsers ?? null,
      maxObras: user.maxObras ?? null,
    };

    return normalizedUser as unknown as TUser;
  }
}
