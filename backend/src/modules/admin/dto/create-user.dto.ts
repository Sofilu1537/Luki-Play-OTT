import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../auth/domain/entities/user.entity';
import { SessionLimitPolicy } from '../../auth/domain/entities/account.entity';

export class CreateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Contraseña inicial del usuario. Si no se provee, se genera una aleatoria.' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contrato?: string;

  @ApiPropertyOptional({ description: 'Número máximo de sesiones o dispositivos simultáneos permitidos.', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDevices?: number;

  @ApiPropertyOptional({ description: 'Duración máxima de la sesión en días.', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sessionDurationDays?: number;

  @ApiPropertyOptional({ enum: SessionLimitPolicy, default: SessionLimitPolicy.BLOCK_NEW })
  @IsOptional()
  @IsEnum(SessionLimitPolicy)
  sessionLimitPolicy?: SessionLimitPolicy;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CLIENTE })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
