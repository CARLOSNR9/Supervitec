import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { BitacoraEstado } from '@prisma/client';
import { Transform } from 'class-transformer';

export class FilterBitacoraDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  obraId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  variableId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  contratistaId?: number;

  @IsOptional()
  @IsEnum(BitacoraEstado)
  estado?: BitacoraEstado;
}
