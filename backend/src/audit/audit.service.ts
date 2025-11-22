import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditLogData {
  actorId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: AuditLogData): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      actorId: data.actorId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: data.details,
      ipAddress: data.ipAddress,
      timestamp: new Date(),
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findAll(filters?: {
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
  }): Promise<AuditLog[]> {
    const where: FindOptionsWhere<AuditLog> = {};

    if (filters?.userId) {
      where.actorId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    const query = this.auditLogRepository.createQueryBuilder('audit_log');

    if (where.actorId) {
      query.where('audit_log.actor_id = :actorId', { actorId: where.actorId });
    }

    if (where.action) {
      query.andWhere('audit_log.action = :action', { action: where.action });
    }

    if (filters?.from) {
      query.andWhere('audit_log.timestamp >= :from', { from: filters.from });
    }

    if (filters?.to) {
      query.andWhere('audit_log.timestamp <= :to', { to: filters.to });
    }

    query.orderBy('audit_log.timestamp', 'DESC').limit(100);

    return query.getMany();
  }
}

