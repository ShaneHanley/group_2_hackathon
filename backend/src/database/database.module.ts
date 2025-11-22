import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { TokenBlacklist } from '../auth/entities/token-blacklist.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { FailedLoginAttempt } from '../auth/entities/failed-login-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV', 'development');
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5433),
          username: configService.get('DB_USERNAME', 'iam'),
          password: configService.get('DB_PASSWORD', 'iam'),
          database: configService.get('DB_DATABASE', 'iam'),
          entities: [User, Role, UserRole, AuditLog, TokenBlacklist, PasswordResetToken, EmailVerificationToken, FailedLoginAttempt],
          synchronize: nodeEnv === 'development', // Disabled in production - use migrations
          logging: configService.get('NODE_ENV') === 'development',
          retryAttempts: 10,
          retryDelay: 3000,
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

