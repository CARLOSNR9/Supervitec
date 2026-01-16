import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { BitacorasService } from './bitacoras.service';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
import { UpdateBitacoraDto } from './dto/update-bitacora.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('bitacoras')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BitacorasController {
  constructor(private readonly bitacorasService: BitacorasService) {}

  // =====================================================
  @Get()
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  async findAll(@Req() req) {
    const user = req.user;

    // 1. ADMIN y DIRECTOR ven TODO (o lógica de director si la tienes separada)
    if (user.role === Role.ADMIN || user.role === Role.DIRECTOR) {
      // Si tienes lógica especial para Director, úsala aquí.
      // Si no, que vean todo:
      return this.bitacorasService.findAll();
    }

    // 2. SUPERVISOR y RESIDENTE ven SOLO LO DE SUS OBRAS
    if (user.role === Role.SUPERVISOR || user.role === Role.RESIDENTE) {
      return this.bitacorasService.findAllByAsignacionObra(user.userId);
    }

    // 3. Fallback por seguridad (si entra otro rol, no ve nada o ve todo según decidas)
    return [];
  }

  // =====================================================
  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const bit = await this.bitacorasService.findOne(id);

    if (req.user.role === Role.ADMIN) return bit;

    if (req.user.role === Role.DIRECTOR) {
      const ok = await this.bitacorasService.validateObraOwner(
        bit.obraId,
        req.user.userId,
      );
      if (!ok) throw new ForbiddenException('No autorizado');
    }

    return bit;
  }

  // =====================================================
  //         🚀 CREAR BITÁCORA + FOTOS (AnyFilesInterceptor)
  // =====================================================
  @Post()
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10, // máximo 10 archivos
      },
    }),
  )
  async create(
    @Body() dto: CreateBitacoraDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    return this.bitacorasService.create(dto, req.user.userId, files);
  }

  // =====================================================
  //         🚀 EDITAR BITÁCORA + NUEVAS FOTOS (AnyFilesInterceptor)
  // =====================================================
  @Patch(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10,
      },
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBitacoraDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    const bit = await this.bitacorasService.findOne(id);

    if (req.user.role !== Role.ADMIN && bit.responsableId !== req.user.userId) {
      throw new ForbiddenException('Solo el creador puede editar');
    }

    return this.bitacorasService.update(id, dto, files);
  }

  // =====================================================
  //   🆕 BORRAR EVIDENCIA (FOTO)
  // =====================================================
  @Delete('evidencia/:id')
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  async deleteEvidence(@Param('id', ParseIntPipe) id: number) {
    return this.bitacorasService.removeEvidence(id);
  }

  // =====================================================
  //         BORRAR BITÁCORA COMPLETA
  // =====================================================
  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.bitacorasService.remove(id);
  }
}
