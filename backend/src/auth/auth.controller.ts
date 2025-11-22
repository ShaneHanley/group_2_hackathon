import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PasswordResetRequestDto, PasswordResetConfirmDto } from './dto/password-reset.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.authService.register(createUserDto, req.ip);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 requests per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get access token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(loginDto, req.ip);
  }

  @Post('password-reset')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset token sent' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto, @Request() req) {
    return this.authService.requestPasswordReset(dto.email, req.ip);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirmPasswordReset(@Body() dto: PasswordResetConfirmDto, @Request() req) {
    return this.authService.confirmPasswordReset(dto.token, dto.newPassword, req.ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken, req.ip);
  }

  @Post('logout')
  @SkipThrottle() // Skip rate limiting for authenticated endpoints
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req, @Body() body?: { refreshToken?: string }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.authService.logout(token, body?.refreshToken, req.ip);
    }
    return { message: 'Logged out successfully' };
  }

  @Get('userinfo')
  @SkipThrottle() // Skip rate limiting for authenticated endpoints
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  async getUserInfo(@Request() req) {
    // User object from JWT strategy already has fresh roles from database
    const user = req.user;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      department: user.department,
      status: user.status,
      roles: user.csis_roles || [], // Fresh roles from database (via JWT strategy)
    };
  }

  @Get('verify-email/:token')
  @ApiOperation({ summary: 'Verify email address with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Param('token') token: string, @Request() req) {
    return this.authService.verifyEmail(token, req.ip);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resendVerification(@Body() body: { email: string }, @Request() req) {
    return this.authService.resendVerificationEmail(body.email, req.ip);
  }
}

