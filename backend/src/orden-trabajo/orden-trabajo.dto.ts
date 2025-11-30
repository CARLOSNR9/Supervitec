// Archivo: backend/src/orden-trabajo/orden-trabajo.dto.ts

import { 
    IsNotEmpty, 
    IsOptional, 
    IsString, 
    MinLength,
    IsEnum,
    IsNumberString
} from 'class-validator';
import { EstadoActividad, EstadoOT } from '@prisma/client'; 

// ---------------------------------------------------------------------
// DTO de Creación de Orden de Trabajo (OT)
// ---------------------------------------------------------------------

export class CreateOrdenTrabajoDto {
  
  @IsNotEmpty({ message: 'El ID de la Obra es obligatorio.' })
  @IsNumberString({}, { message: 'Obra ID debe ser un número.' }) 
  obraId: string; // ✅ Valor esperado: "12"
  
  @IsNotEmpty({ message: 'El objetivo de la Orden de Trabajo es obligatorio.' })
  @IsString({ message: 'Objetivo debe ser una cadena de texto.' })
  @MinLength(10, { message: 'El objetivo debe tener al menos 10 caracteres.' })
  objetivo: string; 
  
  @IsNotEmpty({ message: 'El tipo de trabajo es obligatorio.' })
  @IsString({ message: 'Tipo de trabajo debe ser una cadena de texto.' })
  tipoTrabajo: string;

  @IsOptional()
  @IsString()
  identificacion?: string | null; 
  
  @IsNotEmpty({ message: 'La fecha es obligatoria.' })
  @IsString({ message: 'La fecha debe ser una cadena de texto.' }) // ✅ MÁS FLEXIBLE que IsDateString
  fecha: string; 

  @IsOptional()
  @IsString()
  numeroAuto?: string;
  
  @IsOptional()
  @IsString()
  observaciones?: string | null; 

  @IsNotEmpty({ message: 'La carpeta es obligatoria.' })
  @IsString()
  carpeta: string;

  @IsNotEmpty({ message: 'La actividad es obligatoria.' })
  @IsString()
  actividad: string;

  @IsNotEmpty({ message: 'El estado de la actividad es obligatorio.' })
  @IsEnum(EstadoActividad, { message: 'Estado de Actividad inválido.' })
  estadoActividad: EstadoActividad;

  @IsOptional()
  @IsString()
  n2Opcion?: string | null; // Valor enviado: "Se requiere modificar niveles de desplante"

  @IsOptional()
  @IsEnum(EstadoOT, { message: 'Estado de la OT inválido.' })
  estado?: EstadoOT;
}


// ---------------------------------------------------------------------
// DTO de Actualización de Orden de Trabajo (OT)
// ---------------------------------------------------------------------

export class UpdateOrdenTrabajoDto {
  @IsOptional()
  @IsNumberString() 
  obraId?: string; 

  @IsOptional()
  @IsString()
  @MinLength(10)
  objetivo?: string; 

  @IsOptional()
  @IsString()
  tipoTrabajo?: string;
  
  // ... (otros campos de actualización si son necesarios) ...
}