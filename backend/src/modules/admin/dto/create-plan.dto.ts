import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PlanUserGroupDto {
  INDIVIDUAL = 'INDIVIDUAL',
  FAMILIAR = 'FAMILIAR',
  ISP_BUNDLE = 'ISP_BUNDLE',
  EMPRESARIAL = 'EMPRESARIAL',
  PROMOCIONAL = 'PROMOCIONAL',
}

export enum PlanVideoQualityDto {
  SD = 'SD',
  HD = 'HD',
  FHD = 'FHD',
  UHD_4K = '4K',
}

export enum PlanEntitlementDto {
  LIVE_TV = 'live-tv',
  VOD_BASIC = 'vod-basic',
  VOD_PREMIUM = 'vod-premium',
  SERIES = 'series',
  KIDS = 'kids',
  SPORTS = 'sports',
  RADIO = 'radio',
  ULTRA_HD = '4k',
  DOWNLOADS = 'downloads',
  PPV = 'ppv',
}

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ enum: PlanUserGroupDto })
  @IsEnum(PlanUserGroupDto)
  grupoUsuarios: PlanUserGroupDto;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  moneda?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  duracionDias: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  maxDevices: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  maxConcurrentStreams: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  maxProfiles: number;

  @ApiProperty({ enum: PlanVideoQualityDto })
  @IsEnum(PlanVideoQualityDto)
  videoQuality: PlanVideoQualityDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowDownloads?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowCasting?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasAds?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  trialDays?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  gracePeriodDays?: number;

  @ApiProperty({ type: [String], enum: PlanEntitlementDto })
  @IsArray()
  @ArrayUnique()
  @IsEnum(PlanEntitlementDto, { each: true })
  entitlements: PlanEntitlementDto[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedComponentIds: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedCategoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedChannelIds?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}