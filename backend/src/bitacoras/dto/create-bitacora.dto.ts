import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateBitacoraDto {
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  obraId: number;

  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  variableId: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  contratistaId?: number;

  @IsString()
  @IsNotEmpty()
  estado: string;

  @IsDateString()
  @IsNotEmpty()
  fechaCreacion: string;

  @IsString()
  @IsNotEmpty()
  ubicacion: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  seguimiento?: string;

  @IsOptional()
  @IsDateString()
  fechaMejora?: string;

  @IsOptional()
  @IsDateString()
  fechaEjecucion?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  latitud?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  longitud?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  medicionId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  unidadId?: number;

  // Ignorar archivos en DTO
  @IsOptional()
  files?: any;
}
