import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  ForbiddenException,
  Param,
  ParseIntPipe
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { OrdenTrabajoService } from './orden-trabajo.service';
import { ParseJsonPipe } from '../common/pipes/parse-json.pipe';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orden-trabajo')
export class OrdenTrabajoController {
  constructor(private readonly service: OrdenTrabajoService) {}

  // ======================================================
  // GET ALL
  // ======================================================
  @Get()
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE, Role.VISITANTE)
  async findAll(@Req() req) {
    return this.service.findAll(req.user);
  }

  // ======================================================
  // GET ONE
  // ======================================================
  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE, Role.VISITANTE)
  async findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, req.user);
  }

  // ======================================================
  // CREATE
  // ======================================================
  @Post()
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  @UseInterceptors(FileInterceptor('foto'))
  async create(
    @Body(ParseJsonPipe) dto: CreateOrdenTrabajoDto,
    @UploadedFile() foto: Express.Multer.File,
    @Req() req,
  ) {
    const user = req.user;

    return this.service.create(dto, user, foto);
  }
}
