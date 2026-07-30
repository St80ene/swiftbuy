import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CompanySettingsEntity {
  @IsString()
  @IsOptional()
  themeColor?: string;

  @IsBoolean()
  @IsOptional()
  enableNotifications?: boolean;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  allowSelfRegistration?: boolean;

  [key: string]: unknown; // Allow additional properties
}
