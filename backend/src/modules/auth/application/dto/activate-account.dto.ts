import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateAccountDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'El correo no es válido.' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'A1B2C3D4' })
  @IsString()
  @IsNotEmpty({ message: 'El código de activación es obligatorio.' })
  code: string;

  @ApiProperty({ example: 'MiClaveSegura123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y números.',
  })
  newPassword: string;

  @ApiProperty({ example: 'MiClaveSegura123!' })
  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es obligatoria.' })
  confirmPassword: string;
}
