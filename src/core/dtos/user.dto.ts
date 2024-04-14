import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsNumber()
  rateLimit: number;

  @IsNotEmpty()
  @IsNumber()
  keyExpirationSeconds: number;
}

export class UpdateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNumber()
  rateLimit: number;

  @IsOptional()
  @IsNumber()
  keyExpirationSeconds: number;

  @IsOptional()
  @IsBoolean()
  isKeyActive: boolean;

  @IsOptional()
  @IsBoolean()
  resetRateLimit: boolean;
}
