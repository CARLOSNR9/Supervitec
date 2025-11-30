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
import { Transform } from 'class-transformer'; // 🚀 NECESARIO para la limpieza de cadenas

// Enum basado en tu schema.prisma
export enum EstadoActividadEnum {
    CUMPLE = 'CUMPLE',
    NO_CUMPLE = 'NO_CUMPLE',
    NO_APLICA = 'NO_APLICA',
}

// Función para eliminar espacios y saltos de línea al inicio y al final
const trim = ({ value }) => (typeof value === 'string' ? value.trim() : value);

export class CreateOrdenTrabajoDto {
    
    // 1. obraId (Mandatorio)
    @IsNotEmpty({ message: 'El ID de la obra es obligatorio.' })
    @IsNumberString({}, { message: 'El ID de la obra debe ser un número en formato cadena.' })
    obraId: string;

    // 2. objetivo (Mandatorio)
    @IsNotEmpty({ message: 'El objetivo de la Orden de Trabajo es obligatorio.' })
    @IsString({ message: 'Objetivo debe ser una cadena de texto.' })
    @MinLength(10, { message: 'El objetivo debe tener al menos 10 caracteres.' })
    @MaxLength(500, { message: 'El objetivo no puede exceder los 500 caracteres.' })
    @Transform(trim)
    objetivo: string; 
    
    // 3. tipoTrabajo (Mandatorio)
    @IsNotEmpty({ message: 'El tipo de trabajo es obligatorio.' })
    @IsString({ message: 'Tipo de trabajo debe ser una cadena de texto.' })
    @Transform(trim) // ✅ REFUERZO: Previene cadenas vacías de Select
    tipoTrabajo: string;

    // 4. identificacion (Opcional)
    @IsOptional()
    @IsString({ message: 'Identificación debe ser una cadena de texto.' })
    @Transform(trim)
    identificacion: string | null;
    
    // 5. fecha (Mandatorio)
    @IsNotEmpty({ message: 'La fecha es obligatoria.' })
    @IsDateString({}, { message: 'Formato de fecha no válido.' })
    fecha: string;

    // 6. carpeta (Mandatorio)
    @IsNotEmpty({ message: 'La carpeta es obligatoria.' })
    @IsString({ message: 'Carpeta debe ser una cadena de texto.' })
    @Transform(trim) // ✅ REFUERZO: Previene cadenas vacías de Select
    carpeta: string;

    // 7. actividad (Mandatorio)
    @IsNotEmpty({ message: 'La actividad es obligatoria.' })
    @IsString({ message: 'Actividad debe ser una cadena de texto.' })
    @Transform(trim) // ✅ REFUERZO: Previene cadenas vacías de Select
    actividad: string;

    // 8. estadoActividad (Mandatorio)
    @IsNotEmpty({ message: 'El estado de la actividad es obligatorio.' })
    @IsString({ message: 'El estado de la actividad debe ser una cadena de texto.' })
    @IsIn(Object.values(EstadoActividadEnum), { 
        message: 'Estado de actividad inválido. Debe ser CUMPLE, NO_CUMPLE o NO_APLICA.',
    })
    estadoActividad: EstadoActividadEnum;

    // 9. n2Opcion (Opcional)
    @IsOptional()
    @IsString({ message: 'La opción N2 debe ser una cadena de texto.' })
    @Transform(trim)
    n2Opcion: string | null;

    // 10. observaciones (Opcional)
    @IsOptional()
    @IsString({ message: 'Las observaciones deben ser una cadena de texto.' })
    @MaxLength(500, { message: 'Las observaciones no pueden exceder los 500 caracteres.' })
    @Transform(trim)
    observaciones: string | null;
}