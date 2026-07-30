import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { AuditLogAction, AuditLogEntity } from '../../../enum/audit_log.enum';
import { MaxObjectSize } from '../../../common/validators/max_object_size.validator';

export class CreateAuditLogDto {
  @IsEnum(AuditLogAction, { message: 'Invalid action type' })
  action!: AuditLogAction;

  @IsUUID('4', { message: 'Invalid user ID format', each: true })
  userId?: string;

  @IsEnum(AuditLogEntity, { message: 'Invalid entity type' })
  entity!: AuditLogEntity;

  @IsUUID('4', { message: 'Invalid entity ID format' })
  entityId!: string;

  @IsOptional()
  @IsObject({ message: 'Old value must be an object' })
  @MaxObjectSize(50000)
  oldValue?: Record<string, any>;

  @IsOptional()
  @IsObject({ message: 'New value must be an object' })
  @MaxObjectSize(50000)
  newValue?: Record<string, any>;

  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  @MaxObjectSize(50000)
  metadata?: Record<string, any>;
}
