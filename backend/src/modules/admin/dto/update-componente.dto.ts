import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { COMPONENT_TIPOS } from './create-componente.dto.js';

export class UpdateComponenteDto {
  @ApiPropertyOptional({ example: 'Mi Sección Editada' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Descripción actualizada' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ example: 'film' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  icono?: string;

  @ApiPropertyOptional({ enum: COMPONENT_TIPOS })
  @IsOptional()
  @IsString()
  @IsIn(COMPONENT_TIPOS)
  tipo?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
