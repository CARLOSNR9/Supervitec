import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';

import { ContratistasService } from './contratistas.service';
import { CreateContratistaDto } from './dto/create-contratista.dto';
import { UpdateContratistaDto } from './dto/update-contratista.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contratistas')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ContratistasController {
  constructor(private readonly contratistasService: ContratistasService) {}

  // ============================================================
  // CREATE
  // ============================================================
  @Post()
  @Roles(Role.ADMIN, Role.DIRECTOR)
  create(@Body() dto: CreateContratistaDto, @Req() req) {
    return this.contratistasService.create(dto, req.user);
  }

  // ============================================================
  // GET ALL
  // ============================================================
  @Get()
  @Roles(
    Role.ADMIN,
    Role.DIRECTOR,
    Role.SUPERVISOR,
    Role.RESIDENTE,
    Role.VISITANTE
  )
  findAll(@Req() req) {
    return this.contratistasService.findAll(req.user);
  }

  // ============================================================
  // GET ONE
  // ============================================================
  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.DIRECTOR,
    Role.SUPERVISOR,
    Role.RESIDENTE,
    Role.VISITANTE
  )
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.contratistasService.findOne(id, req.user);
  }

  // ============================================================
  // UPDATE
  // ============================================================
  @Patch(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContratistaDto,
    @Req() req,
  ) {
    return this.contratistasService.update(id, dto, req.user);
  }

  // ============================================================
  // DELETE
  // ============================================================
  @Delete(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.contratistasService.remove(id, req.user);
  }
}
