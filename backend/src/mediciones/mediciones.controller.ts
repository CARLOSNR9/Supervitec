import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MedicionesService } from './mediciones.service';
import { CreateMedicionDto } from './dto/create-medicion.dto';
import { UpdateMedicionDto } from './dto/update-medicion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mediciones')
export class MedicionesController {
  constructor(private readonly medicionesService: MedicionesService) {}

  // 🔹 ADMIN, DIRECTOR, SUPERVISOR y RESIDENTE pueden CONSULTAR
  @Get()
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  findAll() {
    return this.medicionesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medicionesService.findOne(id);
  }

  // 🔒 SOLO ADMIN crea / edita / elimina
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMedicionDto) {
    return this.medicionesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicionDto,
  ) {
    return this.medicionesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.medicionesService.remove(id);
  }
}
