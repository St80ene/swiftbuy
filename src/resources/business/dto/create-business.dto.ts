import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  Length,
} from 'class-validator';
import { BusinessSettingsEntity } from '../entities/business_settings.entity';
import { CloudinaryImage } from '../../../utils/helpers/cloudinary/cloudinary.service';

export class CreateBusinessDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  logo?: CloudinaryImage | null;

  @IsString()
  @IsOptional()
  phone_number?: string;

  @IsString()
  @Length(3, 3) // Enforces standard currency codes (e.g., USD, NGN)
  currency!: string;

  @IsObject()
  @IsOptional()
  settings?: BusinessSettingsEntity;
}
