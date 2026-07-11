export class CreateUserDto {
  first_name!: string;
  last_name!: string;
  email!: string;
  password!: string; // Optional if using federated single-sign-on or auto-generated temp passes
  role?: string; // 'OWNER' | 'MANAGER' | 'CASHIER'
}
