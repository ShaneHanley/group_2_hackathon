import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'alice@csis.edu' })
  @IsEmail()
  email: string;
}

export class PasswordResetConfirmDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewP@ssw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

