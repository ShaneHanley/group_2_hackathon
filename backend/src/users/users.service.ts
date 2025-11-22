import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash,
      displayName: createUserDto.displayName,
      department: createUserDto.department,
      status: UserStatus.PENDING,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    // If password is being updated, hash it
    if (updateUserDto.password) {
      const passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      updateUserDto = { ...updateUserDto, password: undefined } as any;
      (user as any).passwordHash = passwordHash;
    }
    
    // Update other fields
    if (updateUserDto.displayName !== undefined) {
      user.displayName = updateUserDto.displayName;
    }
    if (updateUserDto.department !== undefined) {
      user.department = updateUserDto.department;
    }
    if (updateUserDto.status !== undefined) {
      user.status = updateUserDto.status;
      
    }
    
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    
    try {
      // Delete related records first to avoid foreign key constraint violations
      // Delete user roles
      await this.userRoleRepository.delete({ userId: id });
      
      // Delete email verification tokens
      await this.emailVerificationTokenRepository.delete({ userId: id });
      
      // Delete password reset tokens
      await this.passwordResetTokenRepository.delete({ userId: id });
      
      // Note: Audit logs are kept for historical purposes (no FK constraint)
      // Note: FailedLoginAttempt uses email, not userId, so no FK constraint
      
      // Finally, delete the user
      await this.userRepository.remove(user);
      
      return { message: `User ${user.email} has been deleted successfully` };
    } catch (error) {
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }
}

