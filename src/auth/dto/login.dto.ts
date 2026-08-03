import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @MaxLength(255)
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  password!: string;
}
