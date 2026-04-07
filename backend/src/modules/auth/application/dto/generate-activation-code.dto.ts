import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateActivationCodeDto {
  @ApiProperty({ example: 'usr-001' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'El correo no es válido.' })
  @IsNotEmpty()
  email: string;
}
