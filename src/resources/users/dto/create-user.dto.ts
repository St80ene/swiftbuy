import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsUUID,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message: 'first_name contains invalid characters',
  })
  first_name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message: 'last_name contains invalid characters',
  })
  last_name!: string;

  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUUID()
  role_id!: string;
}

export class ChangeUserRoleDto {
  @IsUUID()
  role_id!: string;
}
