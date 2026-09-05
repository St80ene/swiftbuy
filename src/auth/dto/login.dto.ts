import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { passwordOptions } from './password.dto';
import {
  NormalizeEmail,
  NormalizeString,
} from '../../common/utils/helpers/formatters';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({ allow_underscores: true }, { message: 'Invalid email address' })
  @NormalizeEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @NormalizeString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @IsStrongPassword(
    {
      ...passwordOptions,
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
    },
  )
  password!: string;
}
