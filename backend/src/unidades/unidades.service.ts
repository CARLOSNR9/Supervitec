import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnidadesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.unidad.findMany({
      orderBy: { id: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.unidad.findUnique({ where: { id } });
  }

  async create(data: { nombre: string; observaciones?: string }) {
    return this.prisma.unidad.create({ data });
  }

  async update(id: number, data: { nombre: string; observaciones?: string }) {
    return this.prisma.unidad.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.unidad.delete({ where: { id } });
  }
}
