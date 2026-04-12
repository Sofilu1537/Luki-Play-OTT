import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAppDto {
  @ApiProperty({
    example: 'juan@example.com',
    description: 'Email address of the user',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'device-abc-123',
    description: 'Unique device identifier',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}