import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'lab_manager' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CS', required: false })
  @IsOptional()
  @IsString()
  departmentScope?: string;

  @ApiProperty({ example: ['book_equipment', 'manage_labs'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

