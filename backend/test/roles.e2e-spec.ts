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

    // Create admin user with proper password hash
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('Test123!', 10);
    
    // Delete existing test user first (delete user_roles first due to FK constraint)
    await dataSource.query(`
      DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = 'admin-test@csis.edu')
    `);
    await dataSource.query(`DELETE FROM users WHERE email = 'admin-test@csis.edu'`);
    
    await dataSource.query(`
      INSERT INTO users (id, email, password_hash, display_name, status, created_at, updated_at)
      VALUES (gen_random_uuid(), 'admin-test@csis.edu', '${passwordHash}', 'Admin Test', 'active', NOW(), NOW())
    `);

    const user = await dataSource.query(
      `SELECT id FROM users WHERE email = 'admin-test@csis.edu'`,
    );
    adminUserId = user[0].id;

    // Create admin role and assign it
    await dataSource.query(`
      INSERT INTO roles (id, name, department_scope, permissions, created_at, updated_at)
      VALUES (gen_random_uuid(), 'admin', NULL, '["manage_users", "manage_roles", "view_audit", "manage_system"]'::jsonb, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);

    const role = await dataSource.query(`SELECT id FROM roles WHERE name = 'admin'`);
    const adminRoleId = role[0].id;

    // Delete existing user role first
    await dataSource.query(`
      DELETE FROM user_roles WHERE user_id = '${adminUserId}' AND role_id = '${adminRoleId}'
    `);
    
    await dataSource.query(`
      INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at)
      VALUES (gen_random_uuid(), '${adminUserId}', '${adminRoleId}', '${adminUserId}', NOW())
    `);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin-test@csis.edu',
        password: 'Test123!',
      });

    if (loginResponse.status === 200) {
      adminToken = loginResponse.body.accessToken;
    } else {
      throw new Error(`Failed to login admin user: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
    }
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
    it('should create a new role (admin only)', async () => {
      // Clean up any existing test role
      await dataSource.query(`DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name = 'test_role')`);
      await dataSource.query(`DELETE FROM roles WHERE name = 'test_role'`);
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'test_role',
          permissions: ['test_permission'],
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('test_role');
      roleId = response.body.id;
    });
  });
});

