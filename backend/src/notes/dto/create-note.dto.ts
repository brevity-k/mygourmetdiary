import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsObject,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteType, Visibility } from '@prisma/client';

export class CreateNoteDto {
  @ApiProperty({ enum: NoteType })
  @IsEnum(NoteType)
  type!: NoteType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  binderId!: string;

  @ApiProperty({ minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  freeText?: string;

  @ApiPropertyOptional({ enum: Visibility })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @ApiProperty({ description: 'Type-specific extension data (JSON)' })
  @IsObject()
  extension!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Google Place ID for venue-linked notes' })
  @IsOptional()
  @IsString()
  venueId?: string;

  @ApiProperty()
  @IsDateString()
  experiencedAt!: string;

  @ApiPropertyOptional({ description: 'Photo IDs to attach' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoIds?: string[];
}
