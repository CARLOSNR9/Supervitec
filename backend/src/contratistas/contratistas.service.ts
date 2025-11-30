import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateContratistaDto } from './dto/create-contratista.dto';
import { UpdateContratistaDto } from './dto/update-contratista.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class ContratistasService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE
  // ============================================================
  async create(dto: CreateContratistaDto, user: any) {
    try {
      // ✔ Nunca más contratistas sin dueño
      const directorId = user.userId;

      return await this.prisma.contratista.create({
        data: {
          nombre: dto.nombre,
          responsable: dto.responsable,
          email: dto.email,
          observaciones: dto.observaciones,
          directorId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `El nombre "${dto.nombre}" ya existe.`
          );
        }
      }
      throw new InternalServerErrorException('Error creando contratista.');
    }
  }

  // ============================================================
  // FIND ALL
  // ============================================================
  async findAll(user: any) {
    // ADMIN → ver todos
    if (user.role === Role.ADMIN) {
      return this.prisma.contratista.findMany({
        orderBy: { nombre: 'asc' },
      });
    }

    // ✔ Identificar al dueño del ecosistema
    const directorId =
      user.role === Role.DIRECTOR
        ? user.userId
        : user.ownerDirectorId;

    return this.prisma.contratista.findMany({
      where: {
        directorId,
        NOT: { directorId: null },  // 👈 evita huérfanos heredados
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================
  async findOne(id: number, user: any) {
    const cont = await this.prisma.contratista.findUnique({
      where: { id },
    });

    if (!cont) throw new NotFoundException('Contratista no encontrado.');

    // ADMIN → acceso total
    if (user.role === Role.ADMIN) return cont;

    // DIRECTOR → solo los suyos
    if (user.role === Role.DIRECTOR && cont.directorId !== user.userId) {
      throw new ForbiddenException('No puedes ver este contratista.');
    }

    // Supervisor/Residente/Visitante
    const directorId = user.ownerDirectorId ?? user.userId;

    if (cont.directorId !== directorId) {
      throw new ForbiddenException('No tienes acceso a este contratista.');
    }

    return cont;
  }

  // ============================================================
  // UPDATE
  // ============================================================
  async update(id: number, dto: UpdateContratistaDto, user: any) {
    const cont = await this.prisma.contratista.findUnique({
      where: { id },
    });

    if (!cont)
      throw new NotFoundException('Contratista no encontrado.');

    // ADMIN → ok
    if (user.role !== Role.ADMIN) {
      if (cont.directorId !== user.userId)
        throw new ForbiddenException(
          'No puedes editar contratistas que no son tuyos.'
        );
    }

    return this.prisma.contratista.update({
      where: { id },
      data: dto,
    });
  }

  // ============================================================
  // DELETE
  // ============================================================
  async remove(id: number, user: any) {
    const cont = await this.prisma.contratista.findUnique({
      where: { id },
    });

    if (!cont)
      throw new NotFoundException('Contratista no encontrado.');

    // ADMIN → ok
    if (user.role !== Role.ADMIN) {
      if (cont.directorId !== user.userId)
        throw new ForbiddenException(
          'No puedes eliminar este contratista.'
        );
    }

    return this.prisma.contratista.delete({
      where: { id },
    });
  }
}
