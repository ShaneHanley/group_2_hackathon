import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Roles (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let adminUserId: string;
  let roleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();

    // Create admin user and get token
    await dataSource.query(`
      INSERT INTO users (id, email, password_hash, display_name, status, created_at, updated_at)
      VALUES (gen_random_uuid(), 'admin-test@csis.edu', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'Admin Test', 'active', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);

    const user = await dataSource.query(
      `SELECT id FROM users WHERE email = 'admin-test@csis.edu'`,
    );
    adminUserId = user[0].id;

    // Create admin role and assign it
    await dataSource.query(`
      INSERT INTO roles (id, name, created_at, updated_at)
      VALUES (gen_random_uuid(), 'admin', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);

    const role = await dataSource.query(`SELECT id FROM roles WHERE name = 'admin'`);
    const adminRoleId = role[0].id;

    await dataSource.query(`
      INSERT INTO user_roles (id, user_id, role_id, granted_at)
      VALUES (gen_random_uuid(), '${adminUserId}', '${adminRoleId}', NOW())
      ON CONFLICT DO NOTHING
    `);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin-test@csis.edu',
        password: 'Test123!',
      });

    // Note: In real scenario, you'd need to set the password hash properly
    // For now, we'll create a token manually or use a test helper
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/roles', () => {
    it('should return list of roles', () => {
      return request(app.getHttpServer())
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('POST /api/v1/roles', () => {
    it('should create a new role (admin only)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'test_role',
          permissions: ['test_permission'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('test_role');
          roleId = res.body.id;
        });
    });
  });
});

