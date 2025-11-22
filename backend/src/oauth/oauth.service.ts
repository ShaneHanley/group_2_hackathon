import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/entities/user.entity';
import { TokenBlacklist } from '../auth/entities/token-blacklist.entity';
import { JwtKeyService } from '../jwt/jwt-key.service';

@Injectable()
export class OauthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private jwtKeyService: JwtKeyService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {}

  /**
   * OAuth2 token endpoint - supports password grant and refresh_token grant
   */
  async getToken(grantType: string, params: any): Promise<any> {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');

    switch (grantType) {
      case 'password':
        return this.handlePasswordGrant(params);
      case 'refresh_token':
        return this.handleRefreshTokenGrant(params);
      case 'client_credentials':
        return this.handleClientCredentialsGrant(params);
      default:
        throw new BadRequestException(`Unsupported grant type: ${grantType}`);
    }
  }

  private async handlePasswordGrant(params: any): Promise<any> {
    const { username, password, scope } = params;

    if (!username || !password) {
      throw new BadRequestException('username and password are required');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: username },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get roles
    const roles = user.userRoles?.map((ur) => ur.role.name) || [];

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      email_verified: user.status === UserStatus.ACTIVE,
      csis_roles: roles,
      department: user.department,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const now = Math.floor(Date.now() / 1000);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 minutes
      refresh_expires_in: 604800, // 7 days
      scope: scope || 'openid profile email',
    };
  }

  private async handleRefreshTokenGrant(params: any): Promise<any> {
    const { refresh_token } = params;

    if (!refresh_token) {
      throw new BadRequestException('refresh_token is required');
    }

    try {
      // Check if token is blacklisted
      const blacklisted = await this.tokenBlacklistRepository.findOne({
        where: { token: refresh_token },
      });

      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify refresh token
      const payload = this.jwtService.verify(refresh_token);

      // Get user with roles
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['userRoles', 'userRoles.role'],
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Get updated roles
      const roles = user.userRoles?.map((ur) => ur.role.name) || [];

      // Generate new tokens
      const newPayload = {
        sub: user.id,
        email: user.email,
        email_verified: user.status === UserStatus.ACTIVE,
        csis_roles: roles,
        department: user.department,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      // Blacklist old refresh token (token rotation)
      const tokenExpiry = new Date(payload.exp * 1000);
      await this.tokenBlacklistRepository.save({
        token: refresh_token,
        expiresAt: tokenExpiry,
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: 900,
        refresh_expires_in: 604800,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async handleClientCredentialsGrant(params: any): Promise<any> {
    // For client credentials, you would validate client_id and client_secret
    // This is a simplified implementation
    const { client_id, client_secret } = params;

    // In production, validate against a clients table
    // For now, return an error as this grant type requires client management
    throw new BadRequestException('Client credentials grant not yet implemented');
  }

  /**
   * Introspect JWT token (RFC 7662)
   */
  async introspectToken(token: string): Promise<any> {
    try {
      // Check if token is blacklisted
      const blacklisted = await this.tokenBlacklistRepository.findOne({
        where: { token },
      });

      if (blacklisted) {
        return { active: false };
      }

      const decoded = this.jwtService.verify(token);
      const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');

      return {
        active: true,
        sub: decoded.sub,
        email: decoded.email,
        email_verified: decoded.email_verified || false,
        csis_roles: decoded.csis_roles || [],
        exp: decoded.exp,
        iat: decoded.iat,
        iss: decoded.iss || `${baseUrl}/api/v1`,
        aud: decoded.aud,
      };
    } catch (error) {
      return { active: false };
    }
  }

  /**
   * Get JWKS (JSON Web Key Set) for token verification
   */
  getJWKS(): any {
    return this.jwtKeyService.getJWKS();
  }
}

