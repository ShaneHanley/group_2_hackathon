import { Controller, Post, Body, Get, UseGuards, Request, Query, Res, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { OauthService } from './oauth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('oauth')
@Controller('oauth')
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('token')
  @ApiOperation({ summary: 'OAuth2 token endpoint' })
  async getToken(@Body() body: any, @Res() res: Response) {
    try {
      // Parse form-encoded or JSON body
      const grantType = body.grant_type || body.grantType;
      
      if (!grantType) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'invalid_request',
          error_description: 'grant_type is required',
        });
      }

      const response = await this.oauthService.getToken(grantType, body);
      return res.status(HttpStatus.OK).json(response);
    } catch (error: any) {
      const status = error.status || HttpStatus.BAD_REQUEST;
      return res.status(status).json({
        error: error.response?.error || 'invalid_request',
        error_description: error.message || 'Failed to get token',
      });
    }
  }

  @Get('userinfo')
  @SkipThrottle() // Skip rate limiting for authenticated endpoints
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
  @HttpCode(HttpStatus.OK)
  async introspectToken(@Body() body: { token: string; token_type_hint?: string }) {
    return this.oauthService.introspectToken(body.token);
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
  @SkipThrottle()
  @ApiOperation({ summary: 'OpenID Connect discovery document' })
  async getOpenIdConfiguration() {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    
    return {
      issuer: `${baseUrl}/api/v1`,
      authorization_endpoint: `${baseUrl}/api/v1/oauth/authorize`,
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
  @SkipThrottle()
  @ApiOperation({ summary: 'JSON Web Key Set (JWKS) for token verification' })
  async getJwks() {
    return this.oauthService.getJWKS();
  }
}

