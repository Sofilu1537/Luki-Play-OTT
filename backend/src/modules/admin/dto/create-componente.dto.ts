import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const COMPONENT_TIPOS = [
  'VOD',
  'DESTACADOS',
  'LIVE',
  'SERIES',
  'RADIO',
  'PPV',
  'KIDS',
  'DEPORTES',
  'MUSICA',
  'NOTICIAS',
] as const;

export class CreateComponenteDto {
  @ApiProperty({ example: 'Mi Sección' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre: string;

  @ApiPropertyOptional({ example: 'Descripción visible en el CMS', default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ example: 'film', default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  icono?: string;

  @ApiProperty({ enum: COMPONENT_TIPOS, example: 'VOD' })
  @IsString()
  @IsNotEmpty()
  @IsIn(COMPONENT_TIPOS)
  tipo: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ example: 99, default: 99 })
  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
