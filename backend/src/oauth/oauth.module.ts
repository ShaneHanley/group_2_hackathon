import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OauthController, WellKnownController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '../jwt/jwt.module';
import { User } from '../users/entities/user.entity';
import { TokenBlacklist } from '../auth/entities/token-blacklist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TokenBlacklist]),
    JwtModule,
    AuthModule,
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OauthController, WellKnownController],
  providers: [OauthService],
})
export class OauthModule {}

