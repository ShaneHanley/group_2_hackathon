import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../common/decorators/password-strength.decorator';

export class CreateUserDto {
  @ApiProperty({ example: 'alice@csis.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'P@ssw0rd!', 
    description: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
  })
  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'Alice Smith' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: 'CS', required: false })
  @IsOptional()
  @IsString()
  department?: string;
}

