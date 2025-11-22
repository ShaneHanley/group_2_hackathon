import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    AuditModule,
    AuthModule, // Import AuthModule to make AuthService available for JwtAuthGuard
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

