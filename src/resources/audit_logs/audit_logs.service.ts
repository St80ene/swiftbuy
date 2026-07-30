import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateAuditLogDto } from './dto/create-audit_log.dto';
import { AuditLogQueryDto } from './dto/auditlog_query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit_log.entity';
import { ApiResponse, successResponse } from '../../utils/response.utils';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}
  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createAuditLogDto);

    return await this.auditLogRepository.save(auditLog);
  }

  async findAll(query: AuditLogQueryDto): Promise<
    ApiResponse<{
      auditLogs: AuditLog[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>
  > {
    const {
      page,
      newValue,
      oldValue,
      limit,
      sortBy,
      order,
      userId,
      entity,
      entityId,
      action,
    } = query;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('auditLog');

    if (userId) {
      queryBuilder.andWhere('auditLog.userId = :userId', { userId });
    }

    if (entity) {
      queryBuilder.andWhere('auditLog.entity = :entity', { entity });
    }

    if (entityId) {
      queryBuilder.andWhere('auditLog.entityId = :entityId', { entityId });
    }

    if (action) {
      queryBuilder.andWhere('auditLog.action = :action', { action });
    }

    if (oldValue) {
      queryBuilder.andWhere('auditLog.oldValue = :oldValue', { oldValue });
    }

    if (newValue) {
      queryBuilder.andWhere('auditLog.newValue = :newValue', { newValue });
    }

    queryBuilder.orderBy(`auditLog.${sortBy}`, order);

    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return successResponse('Audit Logs fetched successfully', {
      auditLogs: data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async findOne(id: string): Promise<ApiResponse<AuditLog>> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id },
    });

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID "${id}" not found.`);
    }

    return successResponse('Audit Log retrieved successfully', auditLog);
  }
}
