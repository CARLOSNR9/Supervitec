import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVariableDto } from './dto/create-variable.dto';
import { UpdateVariableDto } from './dto/update-variable.dto';

@Injectable()
export class VariablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.variable.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const variable = await this.prisma.variable.findUnique({
      where: { id },
    });
    if (!variable) {
      throw new NotFoundException(`Variable con ID ${id} no encontrada`);
    }
    return variable;
  }

  async create(data: CreateVariableDto) {
    return this.prisma.variable.create({ data });
  }

  async update(id: number, data: UpdateVariableDto) {
    const variable = await this.findOne(id);
    return this.prisma.variable.update({
      where: { id: variable.id },
      data,
    });
  }

  async remove(id: number) {
    const variable = await this.findOne(id);
    await this.prisma.variable.delete({ where: { id: variable.id } });
    return { message: `Variable con ID ${id} eliminada correctamente` };
  }
}
