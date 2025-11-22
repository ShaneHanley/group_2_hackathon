import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../common/decorators/password-strength.decorator';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'alice@csis.edu' })
  @IsEmail()
  email: string;
}

export class PasswordResetConfirmDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ 
    example: 'NewP@ssw0rd!', 
    description: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
  })
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}

