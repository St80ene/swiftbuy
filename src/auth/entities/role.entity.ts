import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../resources/users/entities/user.entity';
import { RolePermissions } from './role_permissions.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STOREMAN = 'STOREMAN',
  CASHIER = 'CASHIER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
@Entity({ name: 'role' })
export class Role {
  constructor(props?: Partial<Role>) {
    if (props) {
      Object.assign(this, props);
    }
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: UserRole, unique: true })
  name!: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  // It should be optional at the time of role creation, as permissions can be added later.
  @OneToMany(() => RolePermissions, (rolePermission) => rolePermission.role)
  rolePermissions?: RolePermissions[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
