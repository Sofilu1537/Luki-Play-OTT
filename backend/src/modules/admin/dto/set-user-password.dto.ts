import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class SetUserPasswordDto {
  @ApiProperty({
    description: 'Nueva contraseña temporal o definitiva para el usuario.',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiPropertyOptional({
    description: 'Revoca las sesiones activas después del cambio.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  revokeSessions?: boolean;
}
