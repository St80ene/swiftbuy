import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CloudinaryImage } from '../../../utils/helpers/cloudinary/cloudinary.service';
import { BusinessSettingsEntity } from './business_settings.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity({ name: 'businesses' })
export class Business extends BaseEntity {
  constructor(props?: Partial<Business>) {
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
  settings?: BusinessSettingsEntity;

  @OneToMany(() => Category, (category) => category.business)
  categories!: Category[];

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
