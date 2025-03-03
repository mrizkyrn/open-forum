import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Username for login (use nim for students)',
    example: '2110511091',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  username: string;

  @ApiProperty({
    description: 'User password (will be hashed)',
    example: 'StrongP@ssw0rd',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/, {
    message: 'Password must contain at least 8 characters, including upper and lowercase letters and numbers',
  })
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Mochamad Rizky Ramadhan',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;
}
