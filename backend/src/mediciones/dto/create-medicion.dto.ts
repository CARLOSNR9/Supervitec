import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMedicionDto {
  @IsNotEmpty({ message: 'El nombre de la medición es obligatorio' })
  @IsString()
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
