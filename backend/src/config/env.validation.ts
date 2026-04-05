import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  validateSync,
} from 'class-validator';

@ValidatorConstraint({ name: 'noWildcardOrigin', async: false })
class NoWildcardOrigin implements ValidatorConstraintInterface {
  validate(value: string) {
    return !value.split(',').some((origin) => origin.trim() === '*');
  }

  defaultMessage() {
    return 'ALLOWED_ORIGINS must not contain a wildcard "*"';
  }
}

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT?: number;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @IsOptional()
  FIREBASE_PROJECT_ID?: string;

  @IsString()
  @IsOptional()
  FIREBASE_CLIENT_EMAIL?: string;

  @IsString()
  @IsOptional()
  FIREBASE_PRIVATE_KEY?: string;

  @IsString()
  @IsOptional()
  GOOGLE_PLACES_API_KEY?: string;

  @IsString()
  @IsOptional()
  R2_ACCOUNT_ID?: string;

  @IsString()
  @IsOptional()
  R2_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  R2_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  R2_BUCKET_NAME?: string;

  @IsString()
  @IsOptional()
  R2_PUBLIC_URL?: string;

  @IsString()
  @IsOptional()
  MEILISEARCH_HOST?: string;

  @IsString()
  @IsOptional()
  MEILISEARCH_API_KEY?: string;

  @IsString()
  @IsOptional()
  REVENUECAT_WEBHOOK_AUTH_KEY?: string;

  @IsString()
  @IsOptional()
  @Validate(NoWildcardOrigin)
  ALLOWED_ORIGINS?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
