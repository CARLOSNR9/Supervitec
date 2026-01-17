import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BitacoraEstado } from '@prisma/client';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
import { UpdateBitacoraDto } from './dto/update-bitacora.dto';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';

@Injectable()
export class BitacorasService {
  private readonly logger = new Logger(BitacorasService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) { }

  // ============================================================
  // CREATE + CLOUDINARY + CÓDIGO (NUMERACIÓN POR OBRA)
  // ============================================================
  async create(
    dto: CreateBitacoraDto,
    responsableId: number,
    files: Express.Multer.File[] = [],
  ) {
    try {
      const obraId = dto.obraId;

      if (!obraId) {
        throw new NotFoundException('Obra no encontrada');
      }

      const obra = await this.prisma.obra.findUnique({
        where: { id: obraId },
        select: { id: true, prefijo: true },
      });

      if (!obra) {
        throw new NotFoundException('Obra no encontrada');
      }

      const cantidadActual = await this.prisma.bitacora.count({
        where: { obraId: obraId },
      });

      const consecutivo = (cantidadActual + 1).toString().padStart(2, '0');
      const codigoGenerado = `${obra.prefijo || 'OBRA'}-${consecutivo}`;

      const data: any = {
        codigo: codigoGenerado,
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
        obra: { connect: { id: obraId } },
      };

      if (dto.variableId) data.variable = { connect: { id: dto.variableId } };
      if (dto.contratistaId)
        data.contratista = { connect: { id: dto.contratistaId } };
      if (dto.medicionId) data.medicion = { connect: { id: dto.medicionId } };
      if (dto.unidadId) data.unidadRel = { connect: { id: dto.unidadId } };

      const evidenciasCloud: any[] = [];
      this.logger.log(`📦 Files recibidos en create(): ${files?.length ?? 0}`);

      if (files?.length > 0) {
        const results = await Promise.all(
          files.map((f) => this.cloudinary.uploadImage(f)),
        );

        const ok = results.filter((r) => r?.secure_url);

        if (ok.length === 0) {
          throw new InternalServerErrorException(
            'No se pudo subir ninguna imagen a Cloudinary (resultados sin secure_url).',
          );
        }

        ok.forEach((res) => {
          evidenciasCloud.push({
            url: res.secure_url,
            tipo: 'NORMAL',
          });
        });
      }

      const bit = await this.prisma.$transaction(async (tx) => {
        const created = await tx.bitacora.create({ data });

        if (evidenciasCloud.length > 0) {
          // Parsear metadata si existe
          let metaMap: any[] = [];
          if (dto.fotoMetadata) {
            try {
              metaMap = JSON.parse(dto.fotoMetadata);
            } catch (e) {
              this.logger.error('Error parseando fotoMetadata', e);
            }
          }

          await tx.bitacoraMedia.createMany({
            data: evidenciasCloud.map((e, index) => {
              // Intentar cruzar por nombre o índice.
              // Como multer processa en orden, asumimos indice.
              // Ojo: CloudinaryService no devuelve el originalFilename a menos que lo configuremos
              // Pero asumamos que el frontend manda el array en el mismo orden que el backend lo recibe.

              const meta = metaMap[index] || {};
              return {
                ...e,
                bitacoraId: created.id,
                latitud: meta.lat ? parseFloat(meta.lat) : null,
                longitud: meta.lng ? parseFloat(meta.lng) : null,
              };
            }),
          });
        }

        return created;
      });

      return this.findOne(bit.id);
    } catch (error) {
      this.logger.error('❌ Error creando bitácora:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============================================================
  // FIND ALL (ADMIN)
  // ============================================================
  async findAll() {
    return this.prisma.bitacora.findMany({
      include: {
        obra: {
          select: { id: true, nombre: true, directorId: true, prefijo: true },
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
  // FIND ALL BY DIRECTOR (MULTIEMPRESA)
  // ============================================================
  async findAllByDirector(directorId: number) {
    return this.prisma.bitacora.findMany({
      where: {
        OR: [
          { obra: { directorId } },
          { responsable: { ownerDirectorId: directorId } },
          { responsableId: directorId },
        ],
      },
      include: {
        obra: {
          select: { id: true, nombre: true, directorId: true, prefijo: true },
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

  // =================================================================
  // 🔍 BUSCAR SOLO POR OBRAS ASIGNADAS (Para Supervisor/Residente)
  // =================================================================
  async findAllByAsignacionObra(userId: number) {
    return this.prisma.bitacora.findMany({
      where: {
        obra: {
          // ✅ En tu schema se llama "responsables"
          responsables: {
            some: {
              id: userId,
            },
          },
        },
      },
      include: {
        responsable: { select: { id: true, nombreCompleto: true, role: true } },
        obra: { select: { id: true, nombre: true, prefijo: true } },
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
  // FIND ONE
  // ============================================================
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

  // ============================================================
  // UPDATE + CLOUDINARY + BORRADO (SEPARACIÓN ESTRICTA DE FOTOS)
  // ============================================================
  async update(
    id: number,
    dto: UpdateBitacoraDto,
    files: Express.Multer.File[] = [],
  ) {
    try {
      const data: any = {};

      // === estado ===
      if (dto.estado !== undefined) data.estado = dto.estado as BitacoraEstado;

      // === fechas ===
      if (dto.fechaMejora !== undefined)
        data.fechaMejora = dto.fechaMejora ? new Date(dto.fechaMejora) : null;

      if (dto.fechaEjecucion !== undefined)
        data.fechaEjecucion = dto.fechaEjecucion
          ? new Date(dto.fechaEjecucion)
          : null;

      // === strings ===
      if (dto.ubicacion !== undefined)
        data.ubicacion = dto.ubicacion?.trim() || null;

      if (dto.observaciones !== undefined)
        data.observaciones = dto.observaciones?.trim() || null;

      if (dto.seguimiento !== undefined)
        data.seguimiento = dto.seguimiento?.trim() || null;

      // === GPS ===
      if (dto.latitud !== undefined) data.latitud = dto.latitud;
      if (dto.longitud !== undefined) data.longitud = dto.longitud;

      // === RELACIONES ===
      if (dto.obraId !== undefined) {
        data.obra = dto.obraId
          ? { connect: { id: dto.obraId } }
          : { disconnect: true };
      }

      if (dto.variableId !== undefined) {
        data.variable = dto.variableId
          ? { connect: { id: dto.variableId } }
          : { disconnect: true };
      }

      if (dto.contratistaId !== undefined) {
        data.contratista = dto.contratistaId
          ? { connect: { id: dto.contratistaId } }
          : { disconnect: true };
      }

      if (dto.medicionId !== undefined) {
        data.medicion = dto.medicionId
          ? { connect: { id: dto.medicionId } }
          : { disconnect: true };
      }

      if (dto.unidadId !== undefined) {
        data.unidadRel = dto.unidadId
          ? { connect: { id: dto.unidadId } }
          : { disconnect: true };
      }

      // 1) ACTUALIZA DATOS DE TEXTO
      await this.prisma.bitacora.update({
        where: { id },
        data,
      });

      // ==========================================================
      // 🗑️ FASE DE ELIMINACIÓN
      // ==========================================================
      const parseIds = (raw?: string) => {
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return [];
          return parsed
            .map((x) => Number(x))
            .filter((n) => Number.isInteger(n) && n > 0);
        } catch (e) {
          return [];
        }
      };

      if (dto.idsToDelete) {
        const ids = parseIds(dto.idsToDelete);
        if (ids.length > 0) {
          await this.prisma.bitacoraMedia.deleteMany({
            where: { id: { in: ids }, bitacoraId: id },
          });
        }
      }

      if (dto.idsToDeleteSeguimiento) {
        const ids = parseIds(dto.idsToDeleteSeguimiento);
        if (ids.length > 0) {
          await this.prisma.bitacoraSeguimientoMedia.deleteMany({
            where: { id: { in: ids }, bitacoraId: id },
          });
        }
      }

      // ==========================================================
      // 📸 FASE DE SUBIDA (SEPARACIÓN REAL)
      // ==========================================================
      if (files?.length > 0) {
        const fotosNormales = files.filter(
          (f) => f.fieldname === 'fotoFiles' || f.fieldname === 'files',
        );
        const fotosSeguimiento = files.filter(
          (f) => f.fieldname === 'fotosSeguimiento',
        );

        this.logger.log(
          `📸 update(): files=${files.length} | normales=${fotosNormales.length} | seguimiento=${fotosSeguimiento.length}`,
        );

        if (fotosNormales.length > 0) {
          const uploadsNormal = await Promise.all(
            fotosNormales.map((f) => this.cloudinary.uploadImage(f)),
          );

          let metaMap: any[] = [];
          if (dto.fotoMetadata) {
            try {
              metaMap = JSON.parse(dto.fotoMetadata);
            } catch (e) {
              this.logger.error('Error parseando fotoMetadata update', e);
            }
          }

          const dataNormal = uploadsNormal
            .filter((res) => res?.secure_url)
            .map((res, i) => {
              const meta = metaMap[i] || {};
              return {
                bitacoraId: id,
                url: res.secure_url,
                tipo: 'NORMAL',
                latitud: meta.lat ? parseFloat(meta.lat) : null,
                longitud: meta.lng ? parseFloat(meta.lng) : null,
              };
            });

          if (dataNormal.length > 0) {
            await this.prisma.bitacoraMedia.createMany({ data: dataNormal });
          }
        }

        if (fotosSeguimiento.length > 0) {
          const uploadsSeguimiento = await Promise.all(
            fotosSeguimiento.map((f) => this.cloudinary.uploadImage(f)),
          );

          let metaMapSeg: any[] = [];
          if (dto.fotosSeguimientoMetadata) {
            try {
              metaMapSeg = JSON.parse(dto.fotosSeguimientoMetadata);
            } catch (e) {
              this.logger.error('Error parseando fotosSeguimientoMetadata update', e);
            }
          }

          const dataSeguimiento = uploadsSeguimiento
            .filter((res) => res?.secure_url)
            .map((res, i) => {
              const meta = metaMapSeg[i] || {};
              return {
                bitacoraId: id,
                url: res.secure_url,
                tipo: 'SEGUIMIENTO',
                latitud: meta.lat ? parseFloat(meta.lat) : null,
                longitud: meta.lng ? parseFloat(meta.lng) : null,
              };
            });

          if (dataSeguimiento.length > 0) {
            await this.prisma.bitacoraSeguimientoMedia.createMany({
              data: dataSeguimiento,
            });
          }
        }
      }

      return this.findOne(id);
    } catch (error) {
      this.logger.error('❌ ERROR UPDATE BITÁCORA:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============================================================
  // DELETE BITACORA
  // ============================================================
  async remove(id: number) {
    return this.prisma.bitacora.delete({
      where: { id },
    });
  }

  // ============================================================
  // 🗑️ DELETE EVIDENCE (FOTO INDIVIDUAL)
  // ============================================================
  async removeEvidence(id: number) {
    return this.prisma.bitacoraMedia.delete({
      where: { id },
    });
  }

  // ============================================================
  // VALIDATE OBRA OWNER
  // ============================================================
  async validateObraOwner(obraId: number, directorId: number) {
    const obra = await this.prisma.obra.findUnique({
      where: { id: obraId },
    });

    if (!obra) return false;
    return obra.directorId === directorId;
  }
}
