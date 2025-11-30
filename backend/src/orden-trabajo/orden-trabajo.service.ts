import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';

import { Express } from 'express';
import { EstadoActividad, Prisma, Role } from '@prisma/client';

@Injectable()
export class OrdenTrabajoService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // VALIDAR QUE LA OBRA PERTENEZCA AL DIRECTOR
  // ======================================================
  async validateObraOwner(obraId: number, directorId: number) {
    const obra = await this.prisma.obra.findUnique({
      where: { id: obraId },
    });

    if (!obra) return false;

    return obra.directorId === directorId;
  }

  // ======================================================
  // FIND ALL
  // ======================================================
  async findAll(user: any) {
    const { userId, role, ownerDirectorId } = user;

    // ADMIN → ver todas
    if (role === Role.ADMIN) {
      return this.prisma.ordenTrabajo.findMany({
        orderBy: { fecha: 'desc' },
        include: {
          obra: true,
          responsable: true,
        },
      });
    }

    // DIRECTOR → ver solo OT de sus obras
    if (role === Role.DIRECTOR) {
      return this.prisma.ordenTrabajo.findMany({
        where: {
          obra: { directorId: userId },
        },
        orderBy: { fecha: 'desc' },
        include: {
          obra: true,
          responsable: true,
        },
      });
    }

    // SUPERVISOR / RESIDENTE → ver OT donde es responsable o de obras de su director
    if (role === Role.SUPERVISOR || role === Role.RESIDENTE) {
      return this.prisma.ordenTrabajo.findMany({
        where: {
          OR: [
            { responsableId: userId },
            { obra: { directorId: ownerDirectorId } },
          ],
        },
        orderBy: { fecha: 'desc' },
        include: {
          obra: true,
          responsable: true,
        },
      });
    }

    // VISITANTE → solo ver OT de su director
    if (role === Role.VISITANTE) {
      return this.prisma.ordenTrabajo.findMany({
        where: {
          obra: { directorId: ownerDirectorId },
        },
        include: {
          obra: true,
          responsable: true,
        },
      });
    }
  }

  // ======================================================
  // FIND ONE
  // ======================================================
  async findOne(id: number, user: any) {
    const ot = await this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        obra: true,
        responsable: true,
      },
    });

    if (!ot) throw new NotFoundException('OT no encontrada.');

    // ADMIN → acceso total
    if (user.role === Role.ADMIN) return ot;

    // DIRECTOR → validar que la obra es suya
    if (user.role === Role.DIRECTOR && ot.obra.directorId !== user.userId)
      throw new ForbiddenException('No puedes ver OT de obras ajenas.');

    // SUPERVISOR / RESIDENTE → validar obra o responsable
    if (
      (user.role === Role.SUPERVISOR || user.role === Role.RESIDENTE) &&
      ot.obra.directorId !== user.ownerDirectorId &&
      ot.responsableId !== user.userId
    )
      throw new ForbiddenException('No tienes acceso a esta OT.');

    // VISITANTE → solo obra de su director
    if (
      user.role === Role.VISITANTE &&
      ot.obra.directorId !== user.ownerDirectorId
    )
      throw new ForbiddenException('No tienes acceso a esta OT.');

    return ot;
  }

  // ======================================================
  // CREATE
  // ======================================================
  async create(dto: CreateOrdenTrabajoDto, user: any, foto?: Express.Multer.File) {
    const obraId = parseInt(dto.obraId);

    if (isNaN(obraId)) throw new BadRequestException('ObraId inválido.');

    // ADMIN → sin restricciones
    if (user.role === Role.ADMIN) {
      return this.createOT(dto, user.userId);
    }

    // DIRECTOR → validar obra propia
    if (user.role === Role.DIRECTOR) {
      const isOwner = await this.validateObraOwner(obraId, user.userId);
      if (!isOwner)
        throw new ForbiddenException('No puedes crear OT en obras ajenas.');
    }

    // SUPERVISOR / RESIDENTE → validar que pertenece a obra del director
    if (user.role === Role.SUPERVISOR || user.role === Role.RESIDENTE) {
      const obra = await this.prisma.obra.findUnique({
        where: { id: obraId },
      });

      if (!obra || obra.directorId !== user.ownerDirectorId)
        throw new ForbiddenException('No puedes crear OT en esta obra.');
    }

    return this.createOT(dto, user.userId);
  }

  // ======================================================
  // INTERN: CREATE OT
  // ======================================================
  private async createOT(dto: CreateOrdenTrabajoDto, responsableId: number) {
    const fechaISO = new Date(dto.fecha).toISOString();

    return this.prisma.ordenTrabajo.create({
      data: {
        obraId: parseInt(dto.obraId),
        responsableId,
        objetivo: dto.objetivo,
        tipoTrabajo: dto.tipoTrabajo,
        fecha: fechaISO,
        nOrden: dto.identificacion?.trim() || `OT-${Date.now()}`,
        identificacion: dto.identificacion?.trim() || null,
        observaciones: dto.observaciones || null,
        carpeta: dto.carpeta || null,
        actividad: dto.actividad || null,
        estadoActividad: dto.estadoActividad || null,
      },
    });
  }
}
