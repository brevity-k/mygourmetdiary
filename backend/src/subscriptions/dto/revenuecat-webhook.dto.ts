import { IsString, IsObject, IsOptional } from 'class-validator';

export class RevenueCatWebhookDto {
  @IsString()
  type!: string;

  @IsString()
  @IsOptional()
  app_user_id?: string;

  @IsObject()
  @IsOptional()
  event?: {
    type: string;
    app_user_id: string;
    product_id?: string;
    expiration_at_ms?: number;
    [key: string]: unknown;
  };
}
