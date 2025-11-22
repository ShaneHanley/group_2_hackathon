import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'your-secret-key'),
    });
  }

  async validate(payload: any) {
    // Fetch user with fresh roles from database
    const result = await this.authService.getUserWithRoles(payload.sub);
    if (!result) {
      throw new UnauthorizedException();
    }
    
    const { user, roles } = result;
    
    // Use roles from database (always fresh) instead of JWT payload
    // This ensures roles are up-to-date even if token was issued before role assignment
    return {
      ...user,
      csis_roles: roles,
    };
  }
}

