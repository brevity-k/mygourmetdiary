import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VenuesService } from './venues.service';

@ApiTags('venues')
@ApiBearerAuth()
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get('search')
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
    return this.venuesService.getByPlaceId(placeId);
  }
}
