import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { AuditService } from '../audit/audit.service';
@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private auditService: AuditService,
  ) {}

  async getUsers() {
    return this.usersService.findAll();
  }

  async assignUserRole(userId: string, roleId: string, grantedBy: string, ipAddress?: string) {
    const result = await this.rolesService.assignRole(
      userId,
      { roleId },
      grantedBy,
    );


    // Audit log
    await this.auditService.log({
      actorId: grantedBy,
      action: 'role_assigned',
      resourceType: 'user_role',
      resourceId: result.id,
      details: { userId, roleId },
      ipAddress,
    });

    return result;
  }

  async removeUserRole(userId: string, roleId: string, removedBy: string, ipAddress?: string) {
    await this.rolesService.removeRole(userId, roleId);


    // Audit log
    await this.auditService.log({
      actorId: removedBy,
      action: 'role_removed',
      resourceType: 'user_role',
      resourceId: `${userId}-${roleId}`,
      details: { userId, roleId },
      ipAddress,
    });

    return { message: 'Role removed successfully' };
  }

  async getAuditLogs(filters?: any) {
    return this.auditService.findAll(filters);
  }
}

