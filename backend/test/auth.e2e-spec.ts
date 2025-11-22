import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      // Clean up any existing test user (delete related records first due to FK constraints)
      await dataSource.query(`
        DELETE FROM email_verification_tokens WHERE user_id IN (SELECT id FROM users WHERE email = 'test@csis.edu')
      `);
      await dataSource.query(`
        DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = 'test@csis.edu')
      `);
      await dataSource.query(`DELETE FROM users WHERE email = 'test@csis.edu'`);
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@csis.edu',
          password: 'Test123!',
          displayName: 'Test User',
          department: 'CS',
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@csis.edu');
      expect(response.body.status).toBe('pending');
      userId = response.body.id;
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@csis.edu',
          password: 'Test123!',
          displayName: 'Test User 2',
        })
        .expect(400);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should reject login for pending user', async () => {
      // Ensure user is in pending status
      await dataSource.query(
        `UPDATE users SET status = 'pending' WHERE email = 'test@csis.edu'`,
      );
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@csis.edu',
          password: 'Test123!',
        });
      
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('not active');
    });

    it('should login successfully after activation', async () => {
      // Activate user first
      await dataSource.query(
        `UPDATE users SET status = 'active' WHERE email = 'test@csis.edu'`,
      );

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@csis.edu',
          password: 'Test123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@csis.edu',
          password: 'WrongPassword!',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          // Update tokens for next tests
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should reject invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/userinfo', () => {
    it('should return user info with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/userinfo')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body.email).toBe('test@csis.edu');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/userinfo')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken: refreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Logged out successfully');
        });
    });

    it('should reject requests with logged out token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/userinfo')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403); // JWT guard returns 403 Forbidden for blacklisted tokens
    });
  });
});

