import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }) => (typeof value === 'string' ? value.trim() : value);

export class CreateContratistaDto {
  @IsNotEmpty({ message: 'El nombre de la empresa contratista es obligatorio.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres.' })
  @Transform(trim)
  nombre: string; // Nombre de la empresa

  @IsOptional()
  @IsString({ message: 'El nombre del responsable debe ser una cadena de texto.' })
  @MaxLength(100, { message: 'El nombre del responsable no puede exceder los 100 caracteres.' })
  @Transform(trim)
  responsable?: string; // Nombre del contacto

  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido.' })
  email?: string; // Email de contacto

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto.' })
  @MaxLength(500, { message: 'Las observaciones no pueden exceder los 500 caracteres.' })
  @Transform(trim)
  observaciones?: string; // Descripción del trabajo
}