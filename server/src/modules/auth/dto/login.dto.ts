import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username for login',
    example: '2110511091',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'StrongP@ssw0rd',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
