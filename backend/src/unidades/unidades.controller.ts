// backend/src/unidades/unidades.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  // 🔹 ADMIN, DIRECTOR, SUPERVISOR y RESIDENTE pueden CONSULTAR
  @Get()
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  findAll() {
    return this.unidadesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.unidadesService.findOne(id);
  }

  // 🔒 SOLO ADMIN crea / edita / elimina
  @Post()
  @Roles(Role.ADMIN)
  create(
    @Body()
    body: {
      nombre: string;
      observaciones?: string;
    },
  ) {
    return this.unidadesService.create(body);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      nombre: string;
      observaciones?: string;
    },
  ) {
    return this.unidadesService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.unidadesService.remove(id);
  }
}
