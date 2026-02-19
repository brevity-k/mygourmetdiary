import { IsString, IsIn } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  token!: string;

  @IsString()
  @IsIn(['ios', 'android'])
  platform!: string;
}
