import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { VenuesService } from './venues.service';

const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

@ApiTags('venues')
@ApiBearerAuth()
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get('search')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Search venues via Google Places' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'lat', required: false })
  @ApiQuery({ name: 'lng', required: false })
  async search(
    @Query('q') q: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return this.venuesService.search(q, lat, lng);
  }

  @Get(':placeId')
  @ApiOperation({ summary: 'Get venue details by Google Place ID' })
  async getByPlaceId(@Param('placeId') placeId: string) {
    if (!PLACE_ID_PATTERN.test(placeId)) {
      throw new BadRequestException('Invalid placeId format');
    }
    return this.venuesService.getByPlaceId(placeId);
  }
}
