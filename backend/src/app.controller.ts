import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('root')
@Controller()
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'API root endpoint' })
  getRoot() {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    
    return {
      name: 'CSIS IAM API',
      version: '1.0.0',
      description: 'Identity & Access Management Service API',
      documentation: {
        swagger: `${baseUrl}/api`,
        openapi: `${baseUrl}/api-json`,
      },
      endpoints: {
        auth: `${baseUrl}/api/v1/auth`,
        users: `${baseUrl}/api/v1/users`,
        roles: `${baseUrl}/api/v1/roles`,
        admin: `${baseUrl}/api/v1/admin`,
        oauth: `${baseUrl}/api/v1/oauth`,
        discovery: `${baseUrl}/api/v1/.well-known/openid-configuration`,
        jwks: `${baseUrl}/api/v1/.well-known/jwks.json`,
      },
    };
  }
}

