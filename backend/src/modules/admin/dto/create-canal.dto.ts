import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export enum CanalTipoDto {
  LIVE = 'live',
}

export class CreateCanalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty()
  @IsUrl({ require_protocol: true })
  streamUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  detalle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiPropertyOptional({ enum: CanalTipoDto, default: CanalTipoDto.LIVE })
  @IsOptional()
  @IsEnum(CanalTipoDto)
  tipo?: CanalTipoDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiereControlParental?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}