import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoriaDto {
  @ApiProperty({ example: 'Deportes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre: string;

  @ApiPropertyOptional({ example: 'deportes', description: 'Auto-generated from nombre if omitted' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({ example: 'Fútbol, baloncesto y más', default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ example: 'futbol-o', default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icono?: string;

  @ApiPropertyOptional({ example: '#FFB800', description: 'Hex accent color' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'accentColor must be a valid hex color (e.g. #FFB800)' })
  accentColor?: string;

  @ApiPropertyOptional({ example: 5, default: 99 })
  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Mark category as adult content (enables parental control)' })
  @IsOptional()
  @IsBoolean()
  esContenidoAdulto?: boolean;

  @ApiPropertyOptional({ example: ['uuid-1', 'uuid-2'], description: 'Channel IDs to associate' })
  @IsOptional()
  @IsString({ each: true })
  channelIds?: string[];
}
