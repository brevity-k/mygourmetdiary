import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DishCategory {
  APPETIZER = 'APPETIZER',
  MAIN = 'MAIN',
  DESSERT = 'DESSERT',
  SIDE = 'SIDE',
  DRINK = 'DRINK',
  OTHER = 'OTHER',
}

export enum PortionSize {
  SMALL = 'SMALL',
  ADEQUATE = 'ADEQUATE',
  GENEROUS = 'GENEROUS',
}

export enum WineType {
  RED = 'RED',
  WHITE = 'WHITE',
  ROSE = 'ROSE',
  SPARKLING = 'SPARKLING',
  ORANGE = 'ORANGE',
  DESSERT = 'DESSERT',
}

export enum WineFinish {
  SHORT = 'SHORT',
  MEDIUM = 'MEDIUM',
  LONG = 'LONG',
}

export enum SpiritType {
  WHISKEY = 'WHISKEY',
  SAKE = 'SAKE',
  TEQUILA = 'TEQUILA',
  RUM = 'RUM',
  GIN = 'GIN',
  BRANDY = 'BRANDY',
  VODKA = 'VODKA',
  OTHER = 'OTHER',
}

export enum ServingMethod {
  NEAT = 'NEAT',
  ON_ROCKS = 'ON_ROCKS',
  COCKTAIL = 'COCKTAIL',
  WARM = 'WARM',
  OTHER = 'OTHER',
}

export enum PurchaseContext {
  RESTAURANT = 'RESTAURANT',
  WINE_SHOP = 'WINE_SHOP',
  WINERY = 'WINERY',
  ONLINE = 'ONLINE',
}

export class RestaurantExtensionDto {
  @ApiProperty()
  @IsString()
  dishName!: string;

  @ApiProperty({ enum: DishCategory })
  @IsEnum(DishCategory)
  dishCategory!: DishCategory;

  @ApiProperty()
  @IsBoolean()
  wouldOrderAgain!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePaid?: number;

  @ApiPropertyOptional({ enum: PortionSize })
  @IsOptional()
  @IsEnum(PortionSize)
  portionSize?: PortionSize;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisineTags?: string[];
}

export class WineExtensionDto {
  @ApiProperty()
  @IsString()
  wineName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  vintage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grapeVarietal?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ enum: WineType })
  @IsEnum(WineType)
  wineType!: WineType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  noseTags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  palateTags?: string[];

  @ApiPropertyOptional({ enum: WineFinish })
  @IsOptional()
  @IsEnum(WineFinish)
  finish?: WineFinish;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePaid?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pairingNotes?: string;

  @ApiPropertyOptional({ enum: PurchaseContext })
  @IsOptional()
  @IsEnum(PurchaseContext)
  purchaseContext?: PurchaseContext;
}

export class SpiritExtensionDto {
  @ApiProperty()
  @IsString()
  spiritName!: string;

  @ApiProperty({ enum: SpiritType })
  @IsEnum(SpiritType)
  spiritType!: SpiritType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  distillery?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ageStatement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  abv?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  noseTags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  palateTags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  finishTags?: string[];

  @ApiPropertyOptional({ enum: ServingMethod })
  @IsOptional()
  @IsEnum(ServingMethod)
  servingMethod?: ServingMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePaid?: number;
}

export class WineryVisitExtensionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  ambianceRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  serviceRating?: number;

  @ApiProperty()
  @IsBoolean()
  wouldRevisit!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reservationRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tastingFlightNoteIds?: string[];
}
