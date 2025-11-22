import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Check if role with same name already exists
    const existing = await this.findByName(createRoleDto.name);
    if (existing) {
      throw new BadRequestException(`Role with name '${createRoleDto.name}' already exists`);
    }
    
    const role = this.roleRepository.create(createRoleDto);
    const savedRole = await this.roleRepository.save(role);


    return savedRole;
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async assignRole(userId: string, assignRoleDto: AssignRoleDto, grantedBy: string): Promise<UserRole> {
    const role = await this.findOne(assignRoleDto.roleId);
    
    // Check if already assigned
    const existing = await this.userRoleRepository.findOne({
      where: { userId, roleId: assignRoleDto.roleId },
    });

    if (existing) {
      return existing;
    }

    const userRole = this.userRoleRepository.create({
      userId,
      roleId: assignRoleDto.roleId,
      grantedBy,
      expiresAt: assignRoleDto.expiresAt,
    });

    return this.userRoleRepository.save(userRole);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (userRole) {
      await this.userRoleRepository.remove(userRole);
    }
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    return userRoles.map((ur) => ur.role);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    
    // If name is being updated, check for duplicates
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existing = await this.findByName(updateRoleDto.name);
      if (existing) {
        throw new BadRequestException(`Role with name '${updateRoleDto.name}' already exists`);
      }
    }
    
    // Update fields
    if (updateRoleDto.name !== undefined) {
      role.name = updateRoleDto.name;
    }
    if (updateRoleDto.departmentScope !== undefined) {
      role.departmentScope = updateRoleDto.departmentScope;
    }
    if (updateRoleDto.permissions !== undefined) {
      role.permissions = updateRoleDto.permissions;
    }
    
    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    
    // Check if role is assigned to any users
    const userRoles = await this.userRoleRepository.find({
      where: { roleId: id },
    });
    
    if (userRoles.length > 0) {
      throw new BadRequestException(
        `Cannot delete role '${role.name}' because it is assigned to ${userRoles.length} user(s). Remove all assignments first.`
      );
    }
    
    await this.roleRepository.remove(role);
  }
}

