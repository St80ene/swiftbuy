import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NormalizeString } from '../../common/utils/helpers/formatters';

export const passwordOptions = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @IsStrongPassword(passwordOptions)
  newPassword!: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @NormalizeString()
  @MinLength(8)
  currentPassword!: string;

  @IsNotEmpty()
  @IsString()
  @NormalizeString()
  @MinLength(8)
  @IsStrongPassword(passwordOptions)
  newPassword!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;
}
