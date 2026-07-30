import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AuditLogAction, AuditLogEntity } from '../../../enum/audit_log.enum';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  constructor(props: Partial<AuditLog>) {
    super();
    Object.assign(this, props);
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'action',
    type: 'varchar',
    length: 255,
    nullable: true,
    enum: AuditLogAction,
  })
  action!: AuditLogAction;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string;

  @Column({ name: 'entity', type: 'varchar', length: 255, nullable: true })
  entity!: AuditLogEntity;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId!: string;

  @Column({ name: 'old_value', type: 'json', nullable: true })
  oldValue?: Record<string, any>;

  @Column({ name: 'new_value', type: 'json', nullable: true })
  newValue?: Record<string, any>;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
