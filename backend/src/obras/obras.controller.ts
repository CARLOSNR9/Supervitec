// Archivo: backend/src/obras/obras.controller.ts

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
  ForbiddenException,
} from '@nestjs/common';

import { ObrasService } from './obras.service';
import { CreateObraDto, UpdateObraDto } from './obras.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('obras')
@UseGuards(JwtAuthGuard) // 🟩 Protegemos todo el controlador
export class ObrasController {
  constructor(private readonly service: ObrasService) {}

  // ============================================================
  // 1. LISTAR OBRAS
  //    - ADMIN ve todas
  //    - DIRECTOR ve solo sus obras (findByDirector)
  //    - SUPERVISOR/RESIDENTE/VISITANTE → solo obras asignadas
  // ============================================================
  @Get()
  async findAll(@Req() req) {
    const user = req.user;

    if (!user) return this.service.findAll();

    if (user.role === Role.ADMIN) {
      return this.service.findAll();
    }

    if (user.role === Role.DIRECTOR) {
      return this.service.findByDirector(user.userId);
    }

    // SUPERVISOR, RESIDENTE, VISITANTE → solo obras asignadas
    return this.service.findByResponsable(user.userId);
  }

  // ============================================================
  // 2. VER DETALLE DE UNA OBRA
  //    - ADMIN → acceso total
  //    - DIRECTOR → solo si la obra es suya (directorId)
  // ============================================================
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const obra = await this.service.findOne(id);

    // ADMIN → puede ver todo
    if (req.user.role === Role.ADMIN) return obra;

    // DIRECTOR → solo si él es el dueño
    if (req.user.role === Role.DIRECTOR && obra.directorId !== req.user.userId) {
      throw new ForbiddenException('No puedes ver obras que no son tuyas.');
    }

    // Otros roles → si pasó validación o se permite en el service
    return obra;
  }

  // ============================================================
  // 3. CREAR OBRA
  //    - ADMIN y DIRECTOR
  // ============================================================
  @Post()
  @Roles(Role.ADMIN, Role.DIRECTOR)
  async create(@Body() dto: CreateObraDto, @Req() req) {
    return this.service.create(dto, req.user);
  }

  // ============================================================
  // 4. ACTUALIZAR OBRA
  //    ✅ BLINDAJE: Solo ADMIN y DIRECTOR pueden editar
  // ============================================================
  @Patch(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR) // 👈 Solo estos roles pueden editar
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body() dto: UpdateObraDto,
  ) {
    const obra = await this.service.findOne(id);

    if (req.user.role === Role.DIRECTOR && obra.directorId !== req.user.userId) {
      throw new ForbiddenException('No puedes modificar obras de otros directores.');
    }

    return this.service.update(id, dto);
  }

  // ============================================================
  // 5. ELIMINAR OBRA
  //    ✅ BLINDAJE: Solo ADMIN y DIRECTOR pueden borrar
  // ============================================================
  @Delete(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR) // 👈 Solo estos roles pueden borrar
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const obra = await this.service.findOne(id);

    // ADMIN puede borrar cualquier obra
    if (req.user.role === Role.ADMIN) {
      return this.service.remove(id);
    }

    // DIRECTOR solo puede borrar sus propias obras
    if (req.user.role === Role.DIRECTOR && obra.directorId === req.user.userId) {
      return this.service.remove(id);
    }

    throw new ForbiddenException('No puedes eliminar obras de otros directores.');
  }
}
