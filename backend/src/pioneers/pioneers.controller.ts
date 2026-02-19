import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { PioneersService } from './pioneers.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('pioneers')
@ApiBearerAuth()
@Controller('pioneers')
export class PioneersController {
  constructor(private readonly pioneersService: PioneersService) {}

  @Get('zones')
  @ApiOperation({ summary: 'Get pioneer zones on map' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number })
  async getZones(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      throw new BadRequestException('lat and lng are required numbers');
    }
    const radius = Math.min(Math.max(parseFloat(radiusKm || '5'), 1), 50);
    return this.pioneersService.getPioneerZones(latNum, lngNum, radius);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get current user pioneer badges' })
  async getBadges(@CurrentUser() user: User) {
    return this.pioneersService.getUserBadges(user.id);
  }
}
