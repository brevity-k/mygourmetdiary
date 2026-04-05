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
  REDIS_URL!: string;

  @IsString()
  FIREBASE_PROJECT_ID!: string;

  @IsString()
  FIREBASE_CLIENT_EMAIL!: string;

  @IsString()
  FIREBASE_PRIVATE_KEY!: string;

  @IsString()
  GOOGLE_PLACES_API_KEY!: string;

  @IsString()
  R2_ACCOUNT_ID!: string;

  @IsString()
  R2_ACCESS_KEY_ID!: string;

  @IsString()
  R2_SECRET_ACCESS_KEY!: string;

  @IsString()
  R2_BUCKET_NAME!: string;

  @IsString()
  R2_PUBLIC_URL!: string;

  @IsString()
  MEILISEARCH_HOST!: string;

  @IsString()
  MEILISEARCH_API_KEY!: string;

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
