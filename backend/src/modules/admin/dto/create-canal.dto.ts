import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';

export enum CanalStatusDto {
  ACTIVE = 'ACTIVE',
  SCHEDULED = 'SCHEDULED',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

export enum StreamProtocolDto {
  HLS = 'HLS',
  DASH = 'DASH',
  HLS_DASH = 'HLS_DASH',
}

export class CreateCanalDto {
  @ApiProperty({ example: 'ESPN Ecuador' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'espn-ecuador', description: 'URL-friendly slug, auto-generated from name if not provided' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    example: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/.../playlist.m3u8',
    description: 'Primary stream URL (HLS .m3u8 or DASH .mpd)',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  streamUrl: string;

  @ApiPropertyOptional({
    example: 'https://backup-cdn.lukiplay.com/espn/playlist.m3u8',
    description: 'Fallback stream URL, used if primary fails',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  backupUrl?: string;

  @ApiPropertyOptional({
    example: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ESPN_wordmark.svg',
    description: 'Channel logo URL, PNG transparent recommended (200x100px)',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  logoUrl?: string;

  @ApiProperty({ example: 'cat-001', description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'epg_espn_ec',
    description: 'Electronic Program Guide (XMLTV) source ID',
  })
  @IsOptional()
  @IsString()
  epgSourceId?: string;

  @ApiPropertyOptional({
    enum: CanalStatusDto,
    default: CanalStatusDto.ACTIVE,
    description: 'Channel operational status',
  })
  @IsOptional()
  @IsEnum(CanalStatusDto)
  status?: CanalStatusDto;

  @ApiPropertyOptional({
    enum: StreamProtocolDto,
    default: StreamProtocolDto.HLS,
    description: 'Stream protocol type',
  })
  @IsOptional()
  @IsEnum(StreamProtocolDto)
  streamProtocol?: StreamProtocolDto;

  @ApiPropertyOptional({
    example: '1080p',
    enum: ['480p', '720p', '1080p', '4K'],
    default: '1080p',
    description: 'Video resolution',
  })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({
    example: 5000,
    default: 5000,
    description: 'Stream bitrate in kilobits per second',
  })
  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(50000)
  bitrateKbps?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Whether stream is protected with DRM (Widevine/FairPlay)',
  })
  @IsOptional()
  @IsBoolean()
  isDrmProtected?: boolean;

  @ApiPropertyOptional({
    example: 'EC,CO,PE',
    description: 'Comma-separated ISO 3166-1 country codes for geo-restriction. Empty = no restriction.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}(,[A-Z]{2})*$|^$/, {
    message: 'geoRestriction must be empty or valid ISO country codes separated by commas (e.g., EC,CO,PE)',
  })
  geoRestriction?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 99,
    description: 'Display order in channel list',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({
    example: ['plan_basic', 'plan_premium'],
    description: 'Array of plan IDs that have access to this channel',
  })
  @IsOptional()
  @IsString({ each: true })
  planIds?: string[];

  @ApiPropertyOptional({
    default: false,
    description: 'Whether parental control is required for this channel',
  })
  @IsOptional()
  @IsBoolean()
  requiereControlParental?: boolean;
}