import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendRecoveryCodeDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'El correo no es válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email: string;
}
