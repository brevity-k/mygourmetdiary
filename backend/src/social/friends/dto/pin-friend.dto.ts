import { IsString, IsArray, ArrayMinSize, IsEnum } from 'class-validator';
import { TasteCategory } from '@prisma/client';

export class PinFriendDto {
  @IsString()
  pinnedId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(TasteCategory, { each: true })
  categories: TasteCategory[];
}

export class UpdatePinDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(TasteCategory, { each: true })
  categories: TasteCategory[];
}
