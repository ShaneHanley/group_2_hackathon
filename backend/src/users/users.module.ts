import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { KeycloakModule } from '../keycloak/keycloak.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule, // Import AuthModule to make AuthService available for JwtAuthGuard
    KeycloakModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

