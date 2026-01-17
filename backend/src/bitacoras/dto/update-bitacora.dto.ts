import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BitacoraEstado } from '@prisma/client';

const toNumber = ({ value }) =>
  value !== null && value !== undefined && value !== ''
    ? Number(value)
    : undefined;

export class UpdateBitacoraDto {
  @IsOptional()
  @Transform(toNumber)
  obraId?: number;

  @IsOptional()
  @Transform(toNumber)
  responsableId?: number;

  @IsOptional()
  @Transform(toNumber)
  contratistaId?: number;

  @IsOptional()
  @Transform(toNumber)
  variableId?: number;

  @IsOptional()
  @Transform(toNumber)
  medicionId?: number;

  @IsOptional()
  @Transform(toNumber)
  unidadId?: number;

  @IsOptional()
  @IsEnum(BitacoraEstado)
  estado?: BitacoraEstado;

  @IsOptional()
  @IsDateString()
  fechaMejora?: string;

  @IsOptional()
  @IsDateString()
  fechaEjecucion?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  ubicacion?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  observaciones?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  seguimiento?: string;

  @IsOptional()
  @Transform(toNumber)
  latitud?: number;

  @IsOptional()
  @Transform(toNumber)
  longitud?: number;

  // ✅ Metadata de fotos (JSON string)
  @IsOptional()
  @IsString()
  fotoMetadata?: string;

  @IsOptional()
  @IsString()
  fotosSeguimientoMetadata?: string;

  // Ignorar archivos en DTO
  @IsOptional()
  files?: any;

  // ✅ NUEVOS CAMPOS PARA BORRAR FOTOS
  // Recibimos un JSON string ej: "[1,2]"
  @IsOptional()
  @IsString()
  idsToDelete?: string;

  // Recibimos un JSON string ej: "[5,8]"
  @IsOptional()
  @IsString()
  idsToDeleteSeguimiento?: string;
}
