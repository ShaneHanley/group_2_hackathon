import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'alice@csis.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Alice Smith' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: 'CS', required: false })
  @IsOptional()
  @IsString()
  department?: string;
}

