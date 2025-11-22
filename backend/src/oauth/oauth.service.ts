import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

@Injectable()
export class OauthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  /**
   * Get token from Keycloak (proxy request)
   */
  async getTokenFromKeycloak(body: any, keycloakUrl: string, realm: string): Promise<any> {
    try {
      const response = await axios.post(
        `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
        new URLSearchParams(body),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error_description || 'Failed to get token from Keycloak');
    }
  }

  /**
   * Get JWKS from Keycloak
   */
  async getJwksFromKeycloak(keycloakUrl: string, realm: string): Promise<any> {
    try {
      const response = await axios.get(
        `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`
      );
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to get JWKS from Keycloak');
    }
  }

  /**
   * Introspect local JWT token (fallback when Keycloak is unavailable)
   */
  async introspectLocalToken(token: string): Promise<any> {
    try {
      const secret = this.configService.get('JWT_SECRET', 'your-secret-key');
      const decoded = this.jwtService.verify(token, { secret });
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        return { active: false };
      }

      return {
        active: true,
        sub: decoded.sub,
        email: decoded.email,
        email_verified: decoded.email_verified || false,
        csis_roles: decoded.csis_roles || [],
        exp: decoded.exp,
        iat: decoded.iat,
        iss: decoded.iss || this.configService.get('BASE_URL', 'http://localhost:3000'),
        aud: decoded.aud,
      };
    } catch (error) {
      return { active: false };
    }
  }
}

