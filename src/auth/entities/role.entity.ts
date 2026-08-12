import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../resources/users/entities/user.entity';
import { RolePermissions } from './role_permissions.entity';

@Entity({ name: 'role' })
export class Role {
  constructor(props?: Partial<Role>) {
    if (props) {
      Object.assign(this, props);
    }
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  @OneToMany(() => RolePermissions, (rolePermission) => rolePermission.role)
  rolePermissions!: RolePermissions[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
