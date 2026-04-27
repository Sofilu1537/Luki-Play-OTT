import {
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivateAppDto {
  @ApiProperty({ description: 'Customer ID returned by first-access' })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    example: '123456',
    description: 'Código OTP de 6 dígitos enviado al correo',
  })
  @IsString()
  @Length(6, 6)
  otpCode: string;

  @ApiProperty({
    example: 'myNewPassword123',
    description: 'Nueva contraseña (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'juan@gmail.com',
    description: 'Email personal (opcional)',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
