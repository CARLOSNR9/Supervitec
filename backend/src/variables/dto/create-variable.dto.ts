import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVariableDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase().replace(/\s+/g, '_'))
  nombre: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
