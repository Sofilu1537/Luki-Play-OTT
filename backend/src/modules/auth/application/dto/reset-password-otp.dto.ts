import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordOtpDto {
  @ApiProperty({ example: 'usuario@gmail.com', description: 'Correo electrónico del suscriptor' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'Código OTP de 6 dígitos recibido por correo' })
  @IsString()
  @Length(6, 6)
  otpCode: string;

  @ApiProperty({ example: 'NuevaPassword123', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
