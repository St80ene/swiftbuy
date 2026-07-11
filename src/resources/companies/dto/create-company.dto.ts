import { CompanySettings } from '../entities/company.entity';

export class CreateCompanyDto {
  id: string;
  name: string;
  email: string;
  logo: null;
  phone_number?: string;
  currency?: string;
  settings?: CompanySettings;
}
