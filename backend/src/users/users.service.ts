import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { KeycloakService } from '../keycloak/keycloak.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private keycloakService: KeycloakService,
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
      
      // Sync status to Keycloak
      if (user.keycloakId) {
        try {
          await this.keycloakService.updateUser(user.keycloakId, {
            enabled: updateUserDto.status === UserStatus.ACTIVE,
          });
        } catch (error) {
          console.error('Failed to sync user status to Keycloak:', error);
        }
      }
    }
    
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}

