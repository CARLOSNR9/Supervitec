import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObraDto, UpdateObraDto } from './obras.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ObrasService {
  constructor(private prisma: PrismaService) { }

  // ====================================================================
  // 1. OBTENER OBRAS (TODAS)
  // ====================================================================
  async findAll() {
    return this.prisma.obra.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prefijo: true,
        nombre: true,
        observaciones: true,
        estado: true,
        createdAt: true,
        creator: {
          select: { nombreCompleto: true, username: true },
        },
        responsables: {
          select: {
            id: true,
            nombreCompleto: true,
            username: true,
          },
        },
      },
    });
  }

  // ====================================================================
  // 1.1 OBRAS POR DIRECTOR
  // ====================================================================
  async findByDirector(directorId: number) {
    return this.prisma.obra.findMany({
      where: { directorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prefijo: true,
        nombre: true,
        observaciones: true,
        estado: true,
        createdAt: true,
        creator: {
          select: { nombreCompleto: true, username: true },
        },
        responsables: {
          select: {
            id: true,
            nombreCompleto: true,
            username: true,
          },
        },
      },
    });
  }

  // ====================================================================
  // 1.2 OBRAS POR RESPONSABLE (NUEVO MÉTODO)
  // ====================================================================
  async findByResponsable(userId: number) {
    return this.prisma.obra.findMany({
      where: {
        responsables: {
          some: { id: userId },
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prefijo: true,
        nombre: true,
        observaciones: true,
        estado: true,
        createdAt: true,
        creator: {
          select: { nombreCompleto: true, username: true },
        },
        responsables: {
          select: {
            id: true,
            nombreCompleto: true,
            username: true,
          },
        },
      },
    });
  }

  // ====================================================================
  // 2. OBTENER UNA OBRA POR ID
  // ====================================================================
  async findOne(id: number) {
    const obra = await this.prisma.obra.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, nombreCompleto: true, username: true },
        },
        responsables: {
          select: { id: true, nombreCompleto: true, username: true },
        },
      },
    });

    if (!obra) {
      throw new NotFoundException(`Obra con ID ${id} no encontrada.`);
    }
    return obra;
  }

  // ====================================================================
  // 3. CREAR OBRA — VALIDACIÓN DE LÍMITE DE DIRECTOR
  // ====================================================================
  async create(dto: CreateObraDto, creator: any) {
    const creatorId = creator.userId ?? creator.id;

    if (!creatorId) {
      throw new ForbiddenException('No se pudo determinar el usuario creador.');
    }

    if (creator.role === 'DIRECTOR') {
      const director = await this.prisma.user.findUnique({
        where: { id: creatorId },
        select: { id: true, maxObras: true },
      });

      const maxObras = director?.maxObras ?? creator.maxObras ?? 1;

      const totalObras = await this.prisma.obra.count({
        where: { directorId: creatorId },
      });

      console.log('👉 DIRECTOR create Obra');
      console.log('   directorId:', creatorId);
      console.log('   maxObras (BD/token):', maxObras);
      console.log('   totalObras existentes:', totalObras);

      if (maxObras > 0 && totalObras >= maxObras) {
        throw new ForbiddenException(
          `Has alcanzado el límite de ${maxObras} obras permitidas.`,
        );
      }
    }

    // ✅ VALIDAR PREFIJO ÚNICO
    const existingPrefix = await this.prisma.obra.findUnique({
      where: { prefijo: dto.prefijo },
    });
    if (existingPrefix) {
      throw new BadRequestException(
        `El prefijo '${dto.prefijo}' ya está en uso por otra obra.`,
      );
    }

    const { responsablesId, observaciones, ...obraData } = dto;

    const data: Prisma.ObraCreateInput = {
      ...obraData,
      observaciones: observaciones === '' ? null : observaciones,
      creator: { connect: { id: creatorId } },
      responsables: {
        connect: responsablesId.map((id) => ({ id })),
      },
      ...(creator.role === 'DIRECTOR' && {
        director: { connect: { id: creatorId } },
      }),
    };

    try {
      return await this.prisma.obra.create({
        data,
        include: {
          responsables: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            `El prefijo '${dto.prefijo}' ya está en uso. Intenta con una variación.`,
          );
        }
      }
      throw error;
    }
  }

  // ====================================================================
  // 4. ACTUALIZAR OBRA
  // ====================================================================
  async update(id: number, dto: UpdateObraDto) {
    // ✅ VALIDAR PREFIJO ÚNICO AL EDITAR
    if (dto.prefijo) {
      const existing = await this.prisma.obra.findFirst({
        where: {
          prefijo: dto.prefijo,
          id: { not: id }, // Excluir la propia obra
        },
      });
      if (existing) {
        throw new BadRequestException(
          `El prefijo '${dto.prefijo}' ya está en uso por otra obra.`,
        );
      }
    }

    const { responsablesId, observaciones, ...obraData } = dto;

    let responsablesUpdate:
      | Prisma.UserUpdateManyWithoutObrasNestedInput
      | undefined = undefined;

    if (responsablesId) {
      responsablesUpdate = {
        set: responsablesId.map((id) => ({ id })),
      };
    }

    const data: Prisma.ObraUpdateInput = {
      ...obraData,
      ...(observaciones !== undefined && {
        observaciones: observaciones === '' ? null : observaciones,
      }),
      ...(responsablesUpdate && { responsables: responsablesUpdate }),
    };

    try {
      return await this.prisma.obra.update({
        where: { id },
        data,
        include: { responsables: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Obra con ID ${id} no encontrada para actualizar.`,
          );
        }
        if (error.code === 'P2002') {
          throw new BadRequestException(
            `El prefijo '${dto.prefijo}' ya está en uso. Intenta con una variación.`,
          );
        }
      }
      throw error;
    }
  }

  // ====================================================================
  // 5. ELIMINAR OBRA
  // ====================================================================
  async remove(id: number) {
    try {
      return await this.prisma.obra.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Obra con ID ${id} no encontrada para eliminar.`,
        );
      }
      throw error;
    }
  }
}
