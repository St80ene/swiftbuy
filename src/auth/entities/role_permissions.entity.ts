import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity({ name: 'role_permissions' })
export class RolePermissions {
  constructor(props?: Partial<RolePermissions>) {
    if (props) {
      Object.assign(this, props);
    }
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  role_id!: string;

  @Column({ type: 'varchar', length: 36 })
  permission_id!: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
