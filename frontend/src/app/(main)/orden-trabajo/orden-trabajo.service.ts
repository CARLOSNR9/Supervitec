// Archivo: src/orden-trabajo/orden-trabajo.service.ts

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { Express } from 'express';
import { EstadoActividad, Prisma } from '@prisma/client'; // Importamos tipos de Prisma

@Injectable()
export class OrdenTrabajoService {
  constructor(
    private readonly prisma: PrismaService,
    // private readonly uploadService: UploadService, // Servicio de subida de archivos (asumimos)
  ) {}

  async create(
    createOtDto: CreateOrdenTrabajoDto,
    responsableId: number,
    foto?: Express.Multer.File,
  ) {
    // 1. Conversión de IDs (CRÍTICO: obraId es string en DTO, Int en DB)
    const obraIdNum = parseInt(createOtDto.obraId, 10);

    if (isNaN(obraIdNum)) {
      throw new BadRequestException('El ID de la obra no es un número válido.');
    }
    
    // 2. Lógica de subida de archivos (Placeholder, asume que devuelve la URL)
    let fotoUrl: string | null = null;
    // if (foto) {
    //   fotoUrl = await this.uploadService.upload(foto); // Descomentar cuando tengas el uploadService
    // }

    // 🚀 INICIO DE LA TRANSACCIÓN DE PRISMA
    try {
        const result = await this.prisma.$transaction(async (tx) => {
            
            // A. Crear OrdenTrabajo (Nivel 1)
            const ordenTrabajo = await tx.ordenTrabajo.create({
                data: {
                    obraId: obraIdNum, 
                    responsableId: responsableId,
                    // El campo 'identificacion' puede ser null, lo pasamos directamente
                    identificacion: createOtDto.identificacion || null,
                    tipoTrabajo: createOtDto.tipoTrabajo,
                    fecha: new Date(createOtDto.fecha),
                    // 'estado' tiene un valor por defecto ("EN_PROCESO")
                }
            });

            // B. Crear Carpeta (Nivel 2)
            // Asumo un índice fijo 1 para la primera carpeta de la OT
            const carpeta = await tx.carpeta.create({
                data: {
                    ordenTrabajoId: ordenTrabajo.id,
                    nombre: createOtDto.carpeta,
                    indice: 1, 
                }
            });

            // C. Crear Actividad (Nivel 3)
            // Asumo un índice fijo 1 para la primera actividad
            const actividad = await tx.actividad.create({
                data: {
                    carpetaId: carpeta.id,
                    nombre: createOtDto.actividad,
                    indice: 1,
                }
            });

            // D. Crear Evaluación de Actividad (Nivel 4)
            // Usamos el nombre 'n2Opcion' si existe, si no, 'observaciones'
            const observacionesFinales = createOtDto.n2Opcion 
                ? `${createOtDto.n2Opcion}. Observaciones: ${createOtDto.observaciones || ''}`
                : createOtDto.observaciones;

            await tx.evaluacionActividad.create({
                data: {
                    actividadId: actividad.id,
                    // Convertir el string del DTO al ENUM de Prisma (EstadoActividad)
                    estado: createOtDto.estadoActividad as EstadoActividad, 
                    observaciones: observacionesFinales,
                }
            });

            // E. Crear Evidencia (si hay foto)
            if (foto) {
                await tx.actividadMedia.create({
                    data: {
                        actividadId: actividad.id,
                        // 💡 Esto fallará si fotoUrl es null, descomentar solo cuando UploadService esté listo
                        url: fotoUrl || 'placeholder/url', 
                        tipo: foto.mimetype,
                    }
                });
            }

            return ordenTrabajo; // Retorna la OT recién creada
        });

        return result;

    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
             console.error("Error de Prisma en create OT:", e.message);
             // Puedes manejar errores específicos de unicidad (P2002) aquí
        }
        // Lanza un error genérico si la transacción falla
        throw new InternalServerErrorException('Fallo la creación de la Orden de Trabajo y sus registros asociados.');
    }
  }
}