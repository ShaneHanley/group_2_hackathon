import { Controller, Post, Body, Get, UseGuards, Request, Query, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { OauthService } from './oauth.service';
import { KeycloakService } from '../keycloak/keycloak.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('oauth')
@Controller('oauth')
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly keycloakService: KeycloakService,
    private readonly configService: ConfigService,
  ) {}

  @Post('token')
  @ApiOperation({ summary: 'OAuth2 token endpoint (delegates to Keycloak)' })
  async getToken(@Body() body: any, @Res() res: Response) {
    try {
      // Delegate to Keycloak's token endpoint
      const keycloakUrl = this.configService.get('KEYCLOAK_URL', 'http://localhost:8080');
      const realm = this.configService.get('KEYCLOAK_REALM', 'CSIS');
      
      // Forward the request to Keycloak
      const response = await this.oauthService.getTokenFromKeycloak(body, keycloakUrl, realm);
      return res.status(HttpStatus.OK).json(response);
    } catch (error: any) {
      return res.status(error.response?.status || HttpStatus.BAD_REQUEST).json({
        error: 'invalid_request',
        error_description: error.message || 'Failed to get token',
      });
    }
  }

  @Get('userinfo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'OpenID Connect userinfo endpoint' })
  async getUserInfo(@Request() req: any) {
    // Get user info from JWT token (already validated by guard)
    const user = req.user;
    
    return {
      sub: user.id,
      email: user.email,
      email_verified: user.status === 'active',
      name: user.displayName,
      preferred_username: user.email,
      csis_roles: user.csis_roles || [],
      department: user.department,
    };
  }

  @Post('introspect')
  @ApiOperation({ summary: 'Token introspection endpoint (RFC 7662)' })
  async introspectToken(@Body() body: { token: string; token_type_hint?: string }) {
    try {
      // Try Keycloak introspection first
      const introspection = await this.keycloakService.introspectToken(body.token);
      
      if (introspection.active) {
        return {
          active: true,
          sub: introspection.sub,
          email: introspection.email,
          email_verified: introspection.email_verified,
          csis_roles: introspection.realm_access?.roles || introspection.csis_roles || [],
          exp: introspection.exp,
          iat: introspection.iat,
          iss: introspection.iss,
          aud: introspection.aud,
        };
      }
      
      return { active: false };
    } catch (error) {
      // Fallback to local JWT validation
      try {
        const localIntrospection = await this.oauthService.introspectLocalToken(body.token);
        return localIntrospection;
      } catch (localError) {
        return { active: false };
      }
    }
  }
}

@ApiTags('oauth')
@Controller('.well-known')
export class WellKnownController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('openid-configuration')
  @ApiOperation({ summary: 'OpenID Connect discovery document' })
  async getOpenIdConfiguration() {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    const keycloakUrl = this.configService.get('KEYCLOAK_URL', 'http://localhost:8080');
    const realm = this.configService.get('KEYCLOAK_REALM', 'CSIS');
    
    return {
      issuer: `${baseUrl}/api/v1`,
      authorization_endpoint: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`,
      token_endpoint: `${baseUrl}/api/v1/oauth/token`,
      userinfo_endpoint: `${baseUrl}/api/v1/oauth/userinfo`,
      jwks_uri: `${baseUrl}/api/v1/.well-known/jwks.json`,
      introspection_endpoint: `${baseUrl}/api/v1/oauth/introspect`,
      response_types_supported: ['code', 'token', 'id_token', 'code token', 'code id_token', 'token id_token', 'code token id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      claims_supported: ['sub', 'email', 'email_verified', 'name', 'preferred_username', 'csis_roles', 'department'],
    };
  }

  @Get('jwks.json')
  @ApiOperation({ summary: 'JSON Web Key Set (JWKS) for token verification' })
  async getJwks() {
    try {
      // Get JWKS from Keycloak
      const keycloakUrl = this.configService.get('KEYCLOAK_URL', 'http://localhost:8080');
      const realm = this.configService.get('KEYCLOAK_REALM', 'CSIS');
      
      const jwks = await this.oauthService.getJwksFromKeycloak(keycloakUrl, realm);
      return jwks;
    } catch (error) {
      // Fallback: return empty JWKS or generate from local secret
      return {
        keys: [],
      };
    }
  }
}

