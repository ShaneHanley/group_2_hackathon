import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Issuer, Client } from 'openid-client';
import { KeycloakAdminService } from './keycloak-admin.service';

@Injectable()
export class KeycloakService implements OnModuleInit {
  private client: Client;
  private issuer: Issuer<Client>;

  constructor(
    private configService: ConfigService,
    private adminService: KeycloakAdminService,
  ) {}

  async onModuleInit() {
    const keycloakUrl = this.configService.get('KEYCLOAK_URL', 'http://localhost:8080');
    const realm = this.configService.get('KEYCLOAK_REALM', 'CSIS');

    try {
      this.issuer = await Issuer.discover(`${keycloakUrl}/realms/${realm}`);
      this.client = new this.issuer.Client({
        client_id: this.configService.get('KEYCLOAK_CLIENT_ID', 'csis-iam-api'),
        client_secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
        token_endpoint_auth_method: 'client_secret_post',
      });
    } catch (error) {
      console.warn('Keycloak not available, running in fallback mode:', error.message);
    }
  }

  /**
   * Create user in Keycloak using Admin API
   */
  async createUser(userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
    emailVerified: boolean;
    credentials?: Array<{ type: string; value: string; temporary: boolean }>;
  }): Promise<{ id: string }> {
    try {
      return await this.adminService.createUser(userData);
    } catch (error) {
      // Fallback to mock if Keycloak is not available
      console.warn('Keycloak Admin API not available, using fallback');
      return {
        id: `keycloak-${Date.now()}`,
      };
    }
  }

  /**
   * Update user in Keycloak
   */
  async updateUser(userId: string, userData: Partial<{
    email: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
    emailVerified: boolean;
  }>): Promise<void> {
    try {
      await this.adminService.updateUser(userId, userData);
    } catch (error) {
      console.warn('Failed to update user in Keycloak:', error);
    }
  }

  /**
   * Assign role to user in Keycloak
   */
  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    try {
      await this.adminService.assignRoleToUser(userId, roleName);
    } catch (error) {
      console.warn('Failed to assign role in Keycloak:', error);
    }
  }

  /**
   * Remove role from user in Keycloak
   */
  async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    try {
      await this.adminService.removeRoleFromUser(userId, roleName);
    } catch (error) {
      console.warn('Failed to remove role in Keycloak:', error);
    }
  }

  /**
   * Sync roles to Keycloak
   */
  async syncRoles(roles: Array<{ name: string }>): Promise<void> {
    try {
      await this.adminService.syncRoles(roles);
    } catch (error) {
      console.warn('Failed to sync roles to Keycloak:', error);
    }
  }

  /**
   * Get user info from OIDC userinfo endpoint
   */
  async getUserInfo(accessToken: string): Promise<any> {
    if (!this.client) {
      throw new Error('Keycloak client not initialized');
    }

    const userInfo = await this.client.userinfo(accessToken);
    return userInfo;
  }

  /**
   * Introspect token using Keycloak
   */
  async introspectToken(token: string): Promise<any> {
    if (!this.client) {
      throw new Error('Keycloak client not initialized');
    }

    const introspection = await this.client.introspect(token);
    return introspection;
  }
}

