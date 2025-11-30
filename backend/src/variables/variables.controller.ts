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
import { VariablesService } from './variables.service';
import { CreateVariableDto } from './dto/create-variable.dto';
import { UpdateVariableDto } from './dto/update-variable.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('variables')
export class VariablesController {
  constructor(private readonly variablesService: VariablesService) {}

  // 🔹 ADMIN, DIRECTOR, SUPERVISOR y RESIDENTE pueden CONSULTAR
  @Get()
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  findAll() {
    return this.variablesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTOR, Role.SUPERVISOR, Role.RESIDENTE)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.variablesService.findOne(id);
  }

  // 🔒 SOLO ADMIN crea / edita / elimina
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateVariableDto) {
    return this.variablesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVariableDto,
  ) {
    return this.variablesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.variablesService.remove(id);
  }
}
