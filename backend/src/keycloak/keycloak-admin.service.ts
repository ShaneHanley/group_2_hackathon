import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private adminClient: AxiosInstance;
  private accessToken: string;
  private tokenExpiry: Date;
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    this.keycloakUrl = this.configService.get('KEYCLOAK_URL', 'http://localhost:8080');
    this.realm = this.configService.get('KEYCLOAK_REALM', 'CSIS');
    this.clientId = this.configService.get('KEYCLOAK_CLIENT_ID', 'csis-iam-api');
    this.clientSecret = this.configService.get('KEYCLOAK_CLIENT_SECRET', '');

    this.adminClient = axios.create({
      baseURL: `${this.keycloakUrl}/admin/realms/${this.realm}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get admin access token for Keycloak Admin API
   */
  private async getAdminToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // For dev mode, use admin credentials directly
      const adminUsername = this.configService.get('KEYCLOAK_ADMIN', 'admin');
      const adminPassword = this.configService.get('KEYCLOAK_ADMIN_PASSWORD', 'admin');
      
      const response = await axios.post(
        `${this.keycloakUrl}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: adminUsername,
          password: adminPassword,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 60;
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 10) * 1000); // Refresh 10s before expiry

      return this.accessToken;
    } catch (error: any) {
      this.logger.warn('Failed to get Keycloak admin token, running in fallback mode', error.message);
      // Return empty token - operations will fail gracefully
      return '';
    }
  }

  /**
   * Ensure admin token is set in request headers
   */
  private async ensureAuthenticated() {
    const token = await this.getAdminToken();
    this.adminClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Create user in Keycloak
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
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Keycloak admin token not available');
      }

      const keycloakUser = {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: userData.enabled,
        emailVerified: userData.emailVerified,
        credentials: userData.credentials || [],
      };

      const response = await axios.post(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users`,
        keycloakUser,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const location = response.headers.location;
      const userId = location?.split('/').pop();

      if (!userId) {
        throw new Error('Failed to get user ID from Keycloak response');
      }

      return { id: userId };
    } catch (error: any) {
      this.logger.warn('Failed to create user in Keycloak, using fallback', error.response?.data || error.message);
      // Return fallback ID
      return { id: `keycloak-${Date.now()}` };
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
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        return; // Skip if token not available
      }

      await axios.put(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`,
        userData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      this.logger.warn('Failed to update user in Keycloak', error.response?.data || error.message);
      // Don't throw - allow operation to continue
    }
  }

  /**
   * Get user from Keycloak
   */
  async getUser(userId: string): Promise<any> {
    try {
      await this.ensureAuthenticated();

      const response = await this.adminClient.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get user from Keycloak', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get or create role in Keycloak
   */
  async getOrCreateRole(roleName: string): Promise<{ id: string; name: string }> {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Keycloak admin token not available');
      }

      // Try to get existing role
      try {
        const getResponse = await axios.get(
          `${this.keycloakUrl}/admin/realms/${this.realm}/roles/${roleName}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        );
        return { id: getResponse.data.id, name: getResponse.data.name };
      } catch (error: any) {
        // Role doesn't exist, create it
        if (error.response?.status === 404) {
          await axios.post(
            `${this.keycloakUrl}/admin/realms/${this.realm}/roles`,
            { name: roleName },
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const getResponse = await axios.get(
            `${this.keycloakUrl}/admin/realms/${this.realm}/roles/${roleName}`,
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
              },
            }
          );
          return { id: getResponse.data.id, name: getResponse.data.name };
        }
        throw error;
      }
    } catch (error: any) {
      this.logger.warn('Failed to get or create role in Keycloak', error.response?.data || error.message);
      // Return fallback
      return { id: `role-${roleName}`, name: roleName };
    }
  }

  /**
   * Assign role to user in Keycloak
   */
  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        return; // Skip if token not available
      }

      // Get or create the role
      const role = await this.getOrCreateRole(roleName);

      // Assign role to user
      await axios.post(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
        [role],
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      this.logger.warn('Failed to assign role to user in Keycloak', error.response?.data || error.message);
      // Don't throw - allow operation to continue
    }
  }

  /**
   * Remove role from user in Keycloak
   */
  async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        return; // Skip if token not available
      }

      // Get the role
      const roleResponse = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/roles/${roleName}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
      const role = roleResponse.data;

      // Remove role from user
      await axios.delete(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          data: [role],
        }
      );
    } catch (error: any) {
      // If role doesn't exist, that's fine
      if (error.response?.status !== 404) {
        this.logger.warn('Failed to remove role from user in Keycloak', error.response?.data || error.message);
      }
      // Don't throw - allow operation to continue
    }
  }

  /**
   * Get user roles from Keycloak
   */
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        return [];
      }

      const response = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.data.map((role: any) => role.name);
    } catch (error: any) {
      this.logger.warn('Failed to get user roles from Keycloak', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Sync all roles from PostgreSQL to Keycloak
   */
  async syncRoles(roles: Array<{ name: string }>): Promise<void> {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        return; // Skip if token not available
      }

      for (const role of roles) {
        await this.getOrCreateRole(role.name);
      }
    } catch (error: any) {
      this.logger.warn('Failed to sync roles to Keycloak', error.response?.data || error.message);
      // Don't throw - allow operation to continue
    }
  }
}

