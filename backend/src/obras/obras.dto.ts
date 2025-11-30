import { IsNotEmpty, IsOptional, IsString, IsArray, IsNumber, ArrayMinSize, ArrayUnique } from 'class-validator';

// ---------------------------------------------------------------------
// DTO de Creación de Obra
// ---------------------------------------------------------------------

export class CreateObraDto {
  @IsNotEmpty()
  @IsString()
  prefijo: string; // Ej. PJR

  @IsNotEmpty()
  @IsString()
  nombre: string; // Ej. Prueba Javier

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Una obra debe tener al menos un responsable.' })
  @ArrayUnique()
  @IsNumber({}, { each: true, message: 'Los responsables deben ser IDs numéricos.' })
  responsablesId: number[]; // IDs de los usuarios responsables
}

// ---------------------------------------------------------------------
// DTO de Actualización de Obra (Todos los campos son opcionales)
// ---------------------------------------------------------------------

export class UpdateObraDto {
  @IsOptional()
  @IsString()
  prefijo?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsNumber({}, { each: true, message: 'Los responsables deben ser IDs numéricos.' })
  responsablesId?: number[];
}