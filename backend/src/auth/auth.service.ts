import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { KeycloakService } from '../keycloak/keycloak.service';
import { AuditService } from '../audit/audit.service';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    private jwtService: JwtService,
    private keycloakService: KeycloakService,
    private auditService: AuditService,
  ) {}

  async register(createUserDto: CreateUserDto, ipAddress?: string): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Create user in database
    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash,
      displayName: createUserDto.displayName,
      department: createUserDto.department,
      status: UserStatus.PENDING,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    const emailVerificationToken = this.emailVerificationTokenRepository.create({
      userId: savedUser.id,
      token: verificationToken,
      expiresAt,
      used: false,
    });

    await this.emailVerificationTokenRepository.save(emailVerificationToken);

    // Create user in Keycloak
    try {
      const keycloakUser = await this.keycloakService.createUser({
        email: createUserDto.email,
        username: createUserDto.email,
        firstName: createUserDto.displayName.split(' ')[0],
        lastName: createUserDto.displayName.split(' ').slice(1).join(' ') || '',
        enabled: false, // Disabled until email is verified
        emailVerified: false,
        credentials: [
          {
            type: 'password',
            value: createUserDto.password,
            temporary: false,
          },
        ],
      });

      savedUser.keycloakId = keycloakUser.id;
      await this.userRepository.save(savedUser);
    } catch (error) {
      console.error('Failed to create Keycloak user:', error);
      // Continue even if Keycloak creation fails (for demo purposes)
    }

    // In production, send verification email
    // For demo: log the verification token to console
    console.log(`\n📧 Email Verification Token for ${createUserDto.email}:`);
    console.log(`Token: ${verificationToken}`);
    console.log(`Verification URL: http://localhost:5173/verify-email?token=${verificationToken}`);
    console.log(`Expires at: ${expiresAt.toISOString()}\n`);

    // Audit log
    await this.auditService.log({
      action: 'user_created',
      resourceType: 'user',
      resourceId: savedUser.id,
      details: { email: savedUser.email },
      ipAddress,
    });

    return savedUser;
  }

  async login(loginDto: LoginDto, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.auditService.log({
        action: 'login_failed',
        resourceType: 'user',
        resourceId: user.id,
        details: { reason: 'invalid_password' },
        ipAddress,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get roles
    const roles = user.userRoles?.map((ur) => ur.role.name) || [];

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      csis_roles: roles,
      department: user.department,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Audit log
    await this.auditService.log({
      actorId: user.id,
      action: 'login_success',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        department: user.department,
        roles,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return user;
  }

  async refreshToken(refreshToken: string, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Check if token is blacklisted
      const blacklisted = await this.tokenBlacklistRepository.findOne({
        where: { token: refreshToken },
      });

      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Get user with roles
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['userRoles', 'userRoles.role'],
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Get updated roles
      const roles = user.userRoles?.map((ur) => ur.role.name) || [];

      // Generate new tokens
      const newPayload = {
        sub: user.id,
        email: user.email,
        csis_roles: roles,
        department: user.department,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      });

      // Blacklist old refresh token (optional - for token rotation)
      const tokenExpiry = new Date(payload.exp * 1000);
      await this.tokenBlacklistRepository.save({
        token: refreshToken,
        expiresAt: tokenExpiry,
      });

      // Audit log
      await this.auditService.log({
        actorId: user.id,
        action: 'token_refreshed',
        resourceType: 'token',
        resourceId: user.id,
        ipAddress,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(accessToken: string, refreshToken?: string, ipAddress?: string): Promise<void> {
    try {
      // Decode token to get expiry
      const decoded = this.jwtService.decode(accessToken) as any;
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);

      // Add access token to blacklist
      await this.tokenBlacklistRepository.save({
        token: accessToken,
        expiresAt,
      });

      // If refresh token provided, blacklist it too
      if (refreshToken) {
        try {
          const refreshDecoded = this.jwtService.decode(refreshToken) as any;
          const refreshExpiresAt = refreshDecoded?.exp
            ? new Date(refreshDecoded.exp * 1000)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          await this.tokenBlacklistRepository.save({
            token: refreshToken,
            expiresAt: refreshExpiresAt,
          });
        } catch (error) {
          // Ignore errors with refresh token
        }
      }

      // Audit log
      if (decoded?.sub) {
        await this.auditService.log({
          actorId: decoded.sub,
          action: 'logout',
          resourceType: 'session',
          resourceId: decoded.sub,
          ipAddress,
        });
      }
    } catch (error) {
      // Even if token is invalid, we consider logout successful
      console.error('Error during logout:', error);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.tokenBlacklistRepository.findOne({
      where: { token },
    });
    return !!blacklisted;
  }

  async requestPasswordReset(email: string, ipAddress?: string): Promise<{ message: string; token?: string }> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    // But for demo purposes, we'll log the token
    if (!user) {
      // Still return success message to prevent email enumeration
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Invalidate any existing reset tokens for this user
    await this.passwordResetTokenRepository.delete({
      userId: user.id,
      used: false,
    });

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Create reset token (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // Audit log
    await this.auditService.log({
      actorId: user.id,
      action: 'password_reset_requested',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
    });

    // In production, send email with reset link
    // For demo: log the token to console
    console.log(`\n🔐 Password Reset Token for ${email}:`);
    console.log(`Token: ${token}`);
    console.log(`Reset URL: http://localhost:5173/reset-password?token=${token}`);
    console.log(`Expires at: ${expiresAt.toISOString()}\n`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      token: process.env.NODE_ENV === 'development' ? token : undefined, // Only return token in dev mode
    };
  }

  async confirmPasswordReset(token: string, newPassword: string, ipAddress?: string): Promise<{ message: string }> {
    // Find reset token
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is used
    if (resetToken.used) {
      throw new BadRequestException('This reset token has already been used');
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      // Mark as used and delete
      await this.passwordResetTokenRepository.remove(resetToken);
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: resetToken.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    // Mark token as used
    resetToken.used = true;
    await this.passwordResetTokenRepository.save(resetToken);

    // Delete all other unused reset tokens for this user
    await this.passwordResetTokenRepository.delete({
      userId: user.id,
      used: false,
    });

    // Audit log
    await this.auditService.log({
      actorId: user.id,
      action: 'password_reset_completed',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
    });

      return { message: 'Password has been reset successfully' };
    }

  async verifyEmail(token: string, ipAddress?: string): Promise<{ message: string }> {
    // Find verification token
    const verificationToken = await this.emailVerificationTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token is used
    if (verificationToken.used) {
      throw new BadRequestException('This verification token has already been used');
    }

    // Check if token is expired
    if (new Date() > verificationToken.expiresAt) {
      // Mark as used and delete
      await this.emailVerificationTokenRepository.remove(verificationToken);
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: verificationToken.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user status to active
    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    // Update user in Keycloak (enable and mark email as verified)
    if (user.keycloakId) {
      try {
        await this.keycloakService.updateUser(user.keycloakId, {
          enabled: true,
          emailVerified: true,
        });
      } catch (error) {
        console.error('Failed to update Keycloak user after email verification:', error);
      }
    }

    // Mark token as used
    verificationToken.used = true;
    await this.emailVerificationTokenRepository.save(verificationToken);

    // Delete all other unused verification tokens for this user
    await this.emailVerificationTokenRepository.delete({
      userId: user.id,
      used: false,
    });

    // Audit log
    await this.auditService.log({
      actorId: user.id,
      action: 'email_verified',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
    });

    return { message: 'Email verified successfully. Your account is now active.' };
  }

  async resendVerificationEmail(email: string, ipAddress?: string): Promise<{ message: string }> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return { message: 'If an account with that email exists, a verification email has been sent.' };
    }

    // Check if already verified (active)
    if (user.status === UserStatus.ACTIVE) {
      return { message: 'Email is already verified.' };
    }

    // Invalidate any existing unused verification tokens for this user
    await this.emailVerificationTokenRepository.delete({
      userId: user.id,
      used: false,
    });

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    const emailVerificationToken = this.emailVerificationTokenRepository.create({
      userId: user.id,
      token: verificationToken,
      expiresAt,
      used: false,
    });

    await this.emailVerificationTokenRepository.save(emailVerificationToken);

    // In production, send verification email
    // For demo: log the verification token to console
    console.log(`\n📧 Resent Email Verification Token for ${email}:`);
    console.log(`Token: ${verificationToken}`);
    console.log(`Verification URL: http://localhost:5173/verify-email?token=${verificationToken}`);
    console.log(`Expires at: ${expiresAt.toISOString()}\n`);

    // Audit log
    await this.auditService.log({
      actorId: user.id,
      action: 'verification_email_resent',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
    });

    return {
      message: 'If an account with that email exists, a verification email has been sent.',
    };
  }
}

