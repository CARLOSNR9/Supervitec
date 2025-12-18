import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BitacoraEstado } from '@prisma/client';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
 4
import { UpdateBitacoraDto } from './dto/update-bitacora.dto';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';

@Injectable()
export class BitacorasService {
  private readonly logger = new Logger(BitacorasService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService, // ✅ Cloudinary inyectado
  ) {}

  // ============================================================
  // CREATE + CLOUDINARY
  // ============================================================
  async create(
    dto: CreateBitacoraDto,
    responsableId: number,
    files: Express.Multer.File[] = [],
  ) {
    try {
      const data: any = {
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

      // ============================================================
      // SUBIR ARCHIVOS A CLOUDINARY
      // ============================================================
      
const evidenciasCloud: any[] = [];

this.logger.log(`📦 Files recibidos en create(): ${files?.length ?? 0}`);

if (files?.length > 0) {
  // Log mínimo por archivo (para confirmar buffer)
  files.forEach((f, i) => {
    this.logger.log(
      `🖼️ [${i}] ${f.originalname} | mimetype=${f.mimetype} | size=${f.size} | buffer=${f.buffer?.length ?? 0}`,
    );
  });

  // Subida estricta: si Cloudinary falla, que falle la request (así vemos el error real)
  const results = await Promise.all(files.map((f) => this.cloudinary.uploadImage(f)));

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

      // Crear bitácora
      const bit = await this.prisma.bitacora.create({
        data,
      });

      // Guardar imágenes asociadas
      if (evidenciasCloud.length > 0) {
        await this.prisma.bitacoraMedia.createMany({
          data: evidenciasCloud.map((e) => ({
            ...e,
            bitacoraId: bit.id,
          })),
        });
      }

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
        obra: { select: { id: true, nombre: true, directorId: true } },
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
        obra: { select: { id: true, nombre: true, directorId: true } },
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
  // UPDATE + CLOUDINARY
  // ============================================================
  async update(
    id: number,
    dto: UpdateBitacoraDto,
    files: Express.Multer.File[] = [],
  ) {
    try {
      const data: any = {};

      // === estado ===
      if (dto.estado !== undefined)
        data.estado = dto.estado as BitacoraEstado;

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

      // === ACTUALIZA BITÁCORA ===
      await this.prisma.bitacora.update({
        where: { id },
        data,
      });

      // === SUBIR NUEVAS IMÁGENES A CLOUDINARY ===
      if (files?.length > 0) {
        const uploads = files.map((file) =>
          this.cloudinary.uploadImage(file).catch((err) => {
            console.error('❌ Error Cloudinary:', err);
            return null;
          }),
        );

        const results = await Promise.all(uploads);

        const nuevas = results
          .filter((res) => res?.secure_url)
          .map((res) => ({
            bitacoraId: id,
            url: res.secure_url,
            tipo: 'NORMAL',
          }));

        if (nuevas.length > 0) {
          await this.prisma.bitacoraMedia.createMany({
            data: nuevas,
          });
        }
      }

      return this.findOne(id);
    } catch (error) {
      this.logger.error('❌ ERROR UPDATE BITÁCORA:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============================================================
  // DELETE
  // ============================================================
  async remove(id: number) {
    return this.prisma.bitacora.delete({
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
