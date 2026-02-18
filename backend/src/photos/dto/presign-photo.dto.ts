import { IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PresignPhotoDto {
  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mimeType!: string;

  @ApiProperty({ example: 1048576 })
  @IsNumber()
  @Min(1)
  @Max(10 * 1024 * 1024)
  sizeBytes!: number;
}
