import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OauthController, WellKnownController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { KeycloakModule } from '../keycloak/keycloak.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    KeycloakModule,
    AuthModule,
    JwtModule.registerAsync({
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

