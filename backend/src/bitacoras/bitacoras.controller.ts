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
  UseInterceptors
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

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

    if (user.role === Role.ADMIN) return this.bitacorasService.findAll();
    if (user.role === Role.DIRECTOR)
      return this.bitacorasService.findAllByDirector(user.userId);

    return this.bitacorasService.findAllByDirector(user.ownerDirectorId);
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
  //         🚀 CREAR BITÁCORA + FOTOS
  // =====================================================
  @Post()
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  @UseInterceptors(FilesInterceptor('files', 10))
  async create(
    @Body() dto: CreateBitacoraDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    return this.bitacorasService.create(dto, req.user.userId, files);
  }

  // =====================================================
  //         🚀 EDITAR BITÁCORA + NUEVAS FOTOS
  // =====================================================
  @Patch(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  @UseInterceptors(FilesInterceptor('files', 10))
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
  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.bitacorasService.remove(id);
  }
}
