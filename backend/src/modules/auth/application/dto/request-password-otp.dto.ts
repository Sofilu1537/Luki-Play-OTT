import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordOtpDto {
  @ApiProperty({ example: '0503557068', description: 'Cédula de identidad del suscriptor' })
  @IsString()
  @IsNotEmpty()
  idNumber: string;
}
