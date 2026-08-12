import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../../auth/entities/role.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STOREMAN = 'STOREMAN',
  CASHIER = 'CASHIER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

@Entity({ name: 'users' })
export class User extends BaseEntity {
  constructor(props?: Partial<User>) {
    super();
    if (props) {
      Object.assign(this, props);
    }
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  first_name!: string;

  @Column({ type: 'varchar', length: 100 })
  last_name!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false,
  })
  @Exclude()
  password!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  role_id!: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  /**
   * Email Verification
   */
  @Column({
    type: 'boolean',
    default: false,
  })
  is_email_verified!: boolean;

  /**
   * Hashed Refresh Token
   */
  @Column({
    type: 'text',
    nullable: true,
    select: false,
  })
  @Exclude()
  refresh_token?: string | null;

  /**
   * Password Reset
   */
  @Column({
    type: 'text',
    nullable: true,
    select: false,
  })
  @Exclude()
  password_reset_token?: string | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  password_reset_expires_at?: Date | null;

  /**
   * Email Verification Token
   */
  @Column({
    type: 'text',
    nullable: true,
    select: false,
  })
  @Exclude()
  email_verification_token?: string | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  email_verification_expires_at?: Date | null;

  /**
   * Login Security
   */
  @Column({
    type: 'int',
    default: 0,
  })
  failed_login_attempts!: number;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  locked_until?: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  last_login_at?: Date | null;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  last_login_ip?: string | null;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @ManyToOne(() => Role, (role) => role.users, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

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
  deletedAt?: Date | null;
}
