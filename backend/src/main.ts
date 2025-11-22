import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Enable CORS
  // For development: allow all origins (team members on network)
  // For production: restrict to specific domains
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173'];
  
  app.enableCors({
    origin: process.env.NODE_ENV === 'development' 
      ? true // Allow all origins in development (for team access)
      : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Root endpoint (before global prefix)
  app.getHttpAdapter().get('/', (req, res) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    res.json({
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
    });
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CSIS IAM API')
    .setDescription('Identity & Access Management Service API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('roles', 'Role-based access control')
    .addTag('admin', 'Admin operations')
    .addTag('oauth', 'OAuth2/OIDC endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 CSIS IAM API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api`);
}

bootstrap();

