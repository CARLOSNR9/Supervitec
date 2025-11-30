import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdateVariableDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toUpperCase().replace(/\s+/g, '_'))
  nombre?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
