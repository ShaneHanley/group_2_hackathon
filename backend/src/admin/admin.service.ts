import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { AuditService } from '../audit/audit.service';
import { KeycloakService } from '../keycloak/keycloak.service';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private auditService: AuditService,
    private keycloakService: KeycloakService,
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

    // Get user and role details for Keycloak sync
    const user = await this.usersService.findOne(userId);
    const role = await this.rolesService.findOne(roleId);

    // Sync role to Keycloak
    if (user.keycloakId) {
      try {
        // First, ensure the role exists in Keycloak
        await this.keycloakService.syncRoles([{ name: role.name }]);
        // Then assign it to the user
        await this.keycloakService.assignRoleToUser(user.keycloakId, role.name);
      } catch (error) {
        console.error('Failed to sync role assignment to Keycloak:', error);
        // Continue even if Keycloak sync fails
      }
    }

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

    // Get user and role details for Keycloak sync
    const user = await this.usersService.findOne(userId);
    const role = await this.rolesService.findOne(roleId);

    // Sync role removal to Keycloak
    if (user.keycloakId) {
      try {
        await this.keycloakService.removeRoleFromUser(user.keycloakId, role.name);
      } catch (error) {
        console.error('Failed to sync role removal to Keycloak:', error);
        // Continue even if Keycloak sync fails
      }
    }

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

