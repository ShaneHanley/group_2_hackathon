import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';

@ApiTags('admin')
@Controller('admin')
@SkipThrottle() // Skip rate limiting for all admin endpoints
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users/:userId/roles/:roleId')
  @ApiOperation({ summary: 'Assign role to user (admin only)' })
  assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req,
  ) {
    return this.adminService.assignUserRole(userId, roleId, req.user.id, req.ip);
  }

  @Delete('users/:userId/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from user (admin only)' })
  removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req,
  ) {
    return this.adminService.removeUserRole(userId, roleId, req.user.id, req.ip);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get audit logs (admin only)' })
  getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getAuditLogs({ userId, action, from, to });
  }
}

