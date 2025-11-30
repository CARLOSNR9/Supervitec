// 📄 Archivo: src/orden-trabajo/dto/create-orden-trabajo.dto.ts

import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer'; // 🚀 NECESARIO para limpiar los datos

// Asumo que tienes el enum TipoTrabajoEnum y EstadoActividadEnum

// Función para eliminar espacios y saltos de línea al inicio y al final
const trim = ({ value }) => (typeof value === 'string' ? value.trim() : value);

export class CreateOrdenTrabajoDto {
  @IsNotEmpty({ message: 'El ID de la obra es obligatorio.' })
  @IsNumberString({}, { message: 'El ID de la obra debe ser un número en formato cadena.' })
  obraId: string;

  // 🚀 CAMPO CLAVE: objetivo con limpieza y límites estrictos
  @IsNotEmpty({ message: 'El objetivo de la Orden de Trabajo es obligatorio.' })
  @IsString({ message: 'Objetivo debe ser una cadena de texto.' })
  @MinLength(10, { message: 'El objetivo debe tener al menos 10 caracteres.' })
  @MaxLength(500, { message: 'El objetivo no puede exceder los 500 caracteres.' })
  @Transform(trim)
  objetivo: string;

  @IsNotEmpty({ message: 'El tipo de trabajo es obligatorio.' })
  @IsString({ message: 'Tipo de trabajo debe ser una cadena de texto.' })
  // @IsIn(Object.values(TipoTrabajoEnum), { message: 'Tipo de trabajo no válido.' })
  tipoTrabajo: string;

  @IsNotEmpty({ message: 'La carpeta es obligatoria.' })
  @IsString({ message: 'Carpeta debe ser una cadena de texto.' })
  carpeta: string;

  @IsNotEmpty({ message: 'La actividad es obligatoria.' })
  @IsString({ message: 'Actividad debe ser una cadena de texto.' })
  actividad: string;

  @IsNotEmpty({ message: 'La fecha es obligatoria.' })
  @IsDateString({}, { message: 'Formato de fecha no válido.' })
  fecha: string;

  @IsNotEmpty({ message: 'El estado de la actividad es obligatorio.' })
  @IsString({ message: 'Estado de actividad debe ser una cadena de texto.' })
  // @IsIn(Object.values(EstadoActividadEnum), { message: 'Estado de actividad no válido.' })
  estadoActividad: string;

  // 🚀 CAMPO OPCIONAL: identificacion con limpieza
  @IsOptional()
  @IsString({ message: 'Identificación debe ser una cadena de texto.' })
  @Transform(trim)
  identificacion: string | null;

  // 🚀 CAMPO OPCIONAL: n2Opcion con limpieza
  @IsOptional()
  @IsString({ message: 'La opción N2 debe ser una cadena de texto.' })
  @Transform(trim)
  n2Opcion: string | null;

  // 🚀 CAMPO OPCIONAL: observaciones con limpieza y límites
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto.' })
  @MaxLength(500, { message: 'Las observaciones no pueden exceder los 500 caracteres.' })
  @Transform(trim)
  observaciones: string | null;
}