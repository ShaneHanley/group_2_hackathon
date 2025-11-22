import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
        TypeOrmModule.forFeature([User, UserRole, EmailVerificationToken, PasswordResetToken]),
        AuthModule, // Import AuthModule to make AuthService available for JwtAuthGuard
      ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

