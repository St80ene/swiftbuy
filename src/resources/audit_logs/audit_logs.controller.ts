import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { AuditLogsService } from './audit_logs.service';
import { CreateAuditLogDto } from './dto/create-audit_log.dto';
import { AuditLogQueryDto } from './dto/auditlog_query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  create(
    @Body() createAuditLogDto: CreateAuditLogDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.auditLogsService.create(createAuditLogDto, user);
  }

  @Get()
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditLogsService.findOne(id);
  }
}
