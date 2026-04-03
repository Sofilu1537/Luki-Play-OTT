import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../auth/domain/entities/user.entity';

export class CreateCmsUserDto {
  @ApiProperty({ example: 'soporte2@lukiplay.com' })
  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  email: string;

  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ enum: [UserRole.SUPERADMIN, UserRole.SOPORTE] })
  @IsEnum([UserRole.SUPERADMIN, UserRole.SOPORTE], { message: 'Rol inválido.' })
  role: UserRole.SUPERADMIN | UserRole.SOPORTE;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
