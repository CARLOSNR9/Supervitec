import { PartialType } from '@nestjs/swagger';
import { CreateContratistaDto } from './create-contratista.dto';

// Permite que todos los campos del DTO de creación sean opcionales para la actualización
export class UpdateContratistaDto extends PartialType(CreateContratistaDto) {}