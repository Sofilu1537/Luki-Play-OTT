import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12, {
    message: 'La contraseña debe tener al menos 12 caracteres.',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?])/,
    {
      message:
        'La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales.',
    },
  )
  newPassword: string;
}
