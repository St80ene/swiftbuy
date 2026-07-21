import { IsString, IsOptional, IsBoolean } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CloudinaryImage } from '../../../utils/helpers/cloudinary/cloudinary.service';

export class CompanySettings {
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
}

@Entity({ name: 'companies' })
export class Company extends BaseEntity {
  constructor(props?: Partial<Company>) {
    super();
    if (props) {
      Object.assign(this, props);
    }
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  phone_number?: string;

  @Column({ type: 'varchar', default: 'NGN' })
  currency!: string;

  @Column({ type: 'json', nullable: true })
  logo?: CloudinaryImage | null;

  // MySQL Optimized Settings Blob
  // Type is set to 'json' to fully comply with multi-version MySQL engines
  @Column({ type: 'json', nullable: true })
  settings?: CompanySettings;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    type: 'datetime',
    nullable: true,
  })
  deletedAt!: Date | null;
}
