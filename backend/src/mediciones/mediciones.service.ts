import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMedicionDto } from './dto/create-medicion.dto';
import { UpdateMedicionDto } from './dto/update-medicion.dto';

@Injectable()
export class MedicionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.medicion.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.medicion.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Medición con ID ${id} no encontrada`);
    return item;
  }

  async create(data: CreateMedicionDto) {
    return this.prisma.medicion.create({ data });
  }

  async update(id: number, data: UpdateMedicionDto) {
    await this.findOne(id);
    return this.prisma.medicion.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.medicion.delete({ where: { id } });
    return { message: `Medición con ID ${id} eliminada correctamente` };
  }
}
