import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export enum SliderActionDto {
  NONE = 'NONE',
  PLAY_CHANNEL = 'PLAY_CHANNEL',
  NAVIGATE_CATEGORY = 'NAVIGATE_CATEGORY',
  OPEN_URL = 'OPEN_URL',
  SHOW_PLAN = 'SHOW_PLAN',
}

export class CreateSliderDto {
  @ApiProperty({ example: 'Deportes en Vivo' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional({ example: 'No te pierdas ningún partido' })
  @IsOptional()
  @IsString()
  subtitulo?: string;

  @ApiProperty({
    example: 'https://cdn.lukilplay.com/banners/deportes.jpg',
    description: 'URL de la imagen principal (recomendado 1200x628px, 16:9)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(https?:\/\/.+|\/uploads\/.+)$/, {
    message: 'imagen debe ser una URL válida o ruta relativa /uploads/...',
  })
  imagen: string;

  @ApiPropertyOptional({
    example: 'https://cdn.lukilplay.com/banners/deportes-mobile.jpg',
    description: 'URL de imagen para móvil (opcional, recomendado 9:16)',
  })
  @IsOptional()
  @Matches(/^(https?:\/\/.+|\/uploads\/.+)$/, {
    message: 'imagenMobile debe ser una URL válida o ruta relativa /uploads/...',
  })
  imagenMobile?: string;

  @ApiPropertyOptional({
    enum: SliderActionDto,
    default: SliderActionDto.NONE,
    description: 'Acción al tocar el banner',
  })
  @IsOptional()
  @IsEnum(SliderActionDto)
  actionType?: SliderActionDto;

  @ApiPropertyOptional({
    example: 'canal-id-deportes',
    description: 'ID del canal, categoría o URL según actionType',
  })
  @IsOptional()
  @IsString()
  actionValue?: string;

  @ApiPropertyOptional({
    example: '2026-04-28T18:00:00.000Z',
    description: 'Fecha/hora de inicio de visibilidad (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-04-30T23:59:59.000Z',
    description: 'Fecha/hora de fin de visibilidad (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: ['plan-premium', 'plan-full'],
    description: 'IDs de planes que ven este banner. Vacío = todos los planes.',
  })
  @IsOptional()
  @IsString({ each: true })
  planIds?: string[];

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orden?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
