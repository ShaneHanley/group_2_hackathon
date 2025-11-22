import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { TokenBlacklist } from '../auth/entities/token-blacklist.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';

// Load environment variables
config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5433),
  username: configService.get('DB_USERNAME', 'iam'),
  password: configService.get('DB_PASSWORD', 'iam'),
  database: configService.get('DB_DATABASE', 'iam'),
  entities: [
    User,
    Role,
    UserRole,
    AuditLog,
    TokenBlacklist,
    PasswordResetToken,
    EmailVerificationToken,
  ],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

