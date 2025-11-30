import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, BitacoraEstado } from '@prisma/client';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
import { UpdateBitacoraDto } from './dto/update-bitacora.dto';

@Injectable()
export class BitacorasService {
  private readonly prisma = new PrismaClient();
  private readonly logger = new Logger(BitacorasService.name);

  // ============================
  // CREATE + OPCIONAL IMÁGENES
  // ============================
  async create(
    dto: CreateBitacoraDto,
    responsableId: number,
    files: Express.Multer.File[] = [],
  ) {
    try {
      const data: any = {
        // enum BitacoraEstado
        estado: dto.estado as BitacoraEstado,

        fechaCreacion: dto.fechaCreacion
          ? new Date(dto.fechaCreacion)
          : new Date(),

        ubicacion: dto.ubicacion,
        observaciones: dto.observaciones || null,
        seguimiento: dto.seguimiento || null,

        fechaMejora: dto.fechaMejora ? new Date(dto.fechaMejora) : null,
        fechaEjecucion: dto.fechaEjecucion
          ? new Date(dto.fechaEjecucion)
          : null,

        latitud: dto.latitud ?? null,
        longitud: dto.longitud ?? null,

        responsable: { connect: { id: responsableId } },
      };

      if (dto.obraId) data.obra = { connect: { id: dto.obraId } };
      if (dto.variableId) data.variable = { connect: { id: dto.variableId } };
      if (dto.contratistaId)
        data.contratista = { connect: { id: dto.contratistaId } };
      if (dto.medicionId) data.medicion = { connect: { id: dto.medicionId } };
      if (dto.unidadId) data.unidadRel = { connect: { id: dto.unidadId } };

      const bit = await this.prisma.bitacora.create({ data });

      // Guardar imágenes normales (evidencias)
      if (files?.length) {
        await this.prisma.bitacoraMedia.createMany({
          data: files.map((f) => ({
            bitacoraId: bit.id,
            url: `/uploads/bitacoras/${f.filename}`,
            tipo: 'NORMAL', // requerido en el schema
          })),
        });
      }

      // Devolvemos con relaciones completas
      return this.findOne(bit.id);
    } catch (error) {
      this.logger.error('❌ Error creando bitácora:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============================
  // FIND ALL (ADMIN)
  // ============================
  async findAll() {
    return this.prisma.bitacora.findMany({
      include: {
        obra: {
          select: { id: true, nombre: true, directorId: true },
        },
        responsable: {
          select: { id: true, nombreCompleto: true, ownerDirectorId: true },
        },
        variable: true,
        contratista: true,
        medicion: true,
        unidadRel: true,
        evidencias: true,
        evidenciasSeguimiento: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  // ============================================================
  // FILTRADO MULTIEMPRESA (DIRECTOR / SUPERVISOR / RESIDENTE)
  // ============================================================
  async findAllByDirector(directorId: number) {
    return this.prisma.bitacora.findMany({
      where: {
        OR: [
          // 1) Obras cuyo director es este
          { obra: { directorId } },

          // 2) Bitácoras creadas por usuarios del director
          { responsable: { ownerDirectorId: directorId } },

          // 3) Bitácoras creadas por el propio director
          { responsableId: directorId },
        ],
      },
      include: {
        obra: {
          select: { id: true, nombre: true, directorId: true },
        },
        responsable: {
          select: { id: true, nombreCompleto: true, ownerDirectorId: true },
        },
        variable: true,
        contratista: true,
        medicion: true,
        unidadRel: true,
        evidencias: true,
        evidenciasSeguimiento: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  // ============================================================
  // VALIDAR QUE LA OBRA SEA DEL DIRECTOR
  // ============================================================
  async validateObraOwner(obraId: number, directorId: number) {
    const obra = await this.prisma.obra.findUnique({
      where: { id: obraId },
    });

    if (!obra) return false;
    return obra.directorId === directorId;
  }

  // ============================
  // FIND ONE (con medias)
  // ============================
  async findOne(id: number) {
    const bit = await this.prisma.bitacora.findUnique({
      where: { id },
      include: {
        responsable: true,
        obra: true,
        variable: true,
        contratista: true,
        medicion: true,
        unidadRel: true,
        evidencias: true,
        evidenciasSeguimiento: true,
      },
    });

    if (!bit) {
      throw new NotFoundException(`Bitácora con ID ${id} no existe`);
    }

    return bit;
  }

  // ============================
  // UPDATE + NUEVAS IMÁGENES
  // ============================
  async update(
    id: number,
    dto: UpdateBitacoraDto,
    files: Express.Multer.File[] = [],
  ) {
    try {
      const data: any = {};

      // ESTADO (enum)
      if (dto.estado !== undefined) {
        data.estado = dto.estado as BitacoraEstado;
      }

      // FECHAS
      if (dto.fechaMejora !== undefined) {
        data.fechaMejora = dto.fechaMejora
          ? new Date(dto.fechaMejora)
          : null;
      }

      if (dto.fechaEjecucion !== undefined) {
        data.fechaEjecucion = dto.fechaEjecucion
          ? new Date(dto.fechaEjecucion)
          : null;
      }

      // STRINGS
      if (dto.ubicacion !== undefined) {
        data.ubicacion = dto.ubicacion?.trim() || null;
      }

      if (dto.observaciones !== undefined) {
        data.observaciones = dto.observaciones?.trim() || null;
      }

      if (dto.seguimiento !== undefined) {
        data.seguimiento = dto.seguimiento?.trim() || null;
      }

      // GPS
      if (dto.latitud !== undefined) {
        data.latitud = dto.latitud;
      }

      if (dto.longitud !== undefined) {
        data.longitud = dto.longitud;
      }

      // RELACIONES

      // Obra
      if (dto.obraId !== undefined) {
        data.obra = dto.obraId
          ? { connect: { id: dto.obraId } }
          : { disconnect: true };
      }

      // Variable
      if (dto.variableId !== undefined) {
        data.variable = dto.variableId
          ? { connect: { id: dto.variableId } }
          : { disconnect: true };
      }

      // Contratista
      if (dto.contratistaId !== undefined) {
        data.contratista = dto.contratistaId
          ? { connect: { id: dto.contratistaId } }
          : { disconnect: true };
      }

      // Medición
      if (dto.medicionId !== undefined) {
        data.medicion = dto.medicionId
          ? { connect: { id: dto.medicionId } }
          : { disconnect: true };
      }

      // Unidad
      if (dto.unidadId !== undefined) {
        data.unidadRel = dto.unidadId
          ? { connect: { id: dto.unidadId } }
          : { disconnect: true };
      }

      // 1) Actualizar la bitácora
      await this.prisma.bitacora.update({
        where: { id },
        data,
      });

      // 2) Agregar nuevas evidencias (NORMAL)
      if (files?.length) {
        await this.prisma.bitacoraMedia.createMany({
          data: files.map((f) => ({
            bitacoraId: id,
            url: `/uploads/bitacoras/${f.filename}`,
            tipo: 'NORMAL',
          })),
        });
      }

      // 3) Devolver bitácora completa
      return this.findOne(id);
    } catch (error) {
      this.logger.error('❌ ERROR UPDATE BITÁCORA:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============================
  // DELETE
  // ============================
  async remove(id: number) {
    return this.prisma.bitacora.delete({
      where: { id },
    });
  }
}
