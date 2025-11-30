import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ===============================================================
  // 1. Listar usuarios
  //    ADMIN → todos
  //    DIRECTOR → solo sus usuarios (ownerDirectorId)
  // ===============================================================
 @Get()
@Roles(Role.ADMIN, Role.DIRECTOR)
findAll(@Req() req) {
  return this.service.findAll(req.user);
}

  // ===============================================================
  // 2. Obtener un usuario por ID
  // ===============================================================
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // ===============================================================
  // 3. Crear usuario
  //    ADMIN → puede crear cualquier rol (y definir maxUsers/maxObras para DIRECTOR)
  //    DIRECTOR → solo puede crear SUPERVISOR / RESIDENTE / VISITANTE (y con límite)
  // ===============================================================
  @Post()
  @Roles(Role.ADMIN, Role.DIRECTOR)
  create(
    @Body()
    dto: {
      username: string;
      password: string;
      nombreCompleto: string;
      email: string;
      phone: string;
      role: Role;
      active: boolean;
      maxUsers?: number;
      maxObras?: number;
    },
    @Req() req,
  ) {
    return this.service.create(dto, req.user);
  }

  // ===============================================================
  // 4. Actualizar usuario
  // ===============================================================
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: Partial<{
      username: string;
      password: string;
      nombreCompleto: string;
      role: Role;
      active: boolean;
      email: string;
      phone: string;
      maxUsers: number;
      maxObras: number;
    }>,
  ) {
    return this.service.update(id, dto);
  }

  // ===============================================================
  // 5. Eliminar usuario
  // ===============================================================
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
