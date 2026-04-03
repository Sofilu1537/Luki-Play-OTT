import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@lukiplay.com' })
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  email: string;
}
