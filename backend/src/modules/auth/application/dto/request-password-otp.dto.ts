import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordOtpDto {
  @ApiProperty({ example: 'usuario@gmail.com', description: 'Correo electrónico del suscriptor' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
