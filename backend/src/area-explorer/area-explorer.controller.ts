import { Controller, Get, Query, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AreaExplorerService } from './area-explorer.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Premium } from '../common/decorators/premium.decorator';

@ApiTags('explore')
@ApiBearerAuth()
@Controller('explore')
export class AreaExplorerController {
  constructor(private readonly areaExplorerService: AreaExplorerService) {}

  @Get('map')
  @ApiOperation({ summary: 'Get map pins for area explorer' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'friendsOnly', required: false, type: Boolean })
  async getMapPins(
    @CurrentUser() user: User,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('category') category?: string,
    @Query('friendsOnly') friendsOnly?: string,
  ) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      throw new BadRequestException('lat and lng are required numbers');
    }

    const radius = Math.min(Math.max(parseFloat(radiusKm || '5'), 1), 50);
    const isFriendsOnly = friendsOnly === 'true';

    // friendsOnly requires premium
    if (isFriendsOnly && user.subscriptionTier !== 'CONNOISSEUR') {
      throw new ForbiddenException('Friends-only view requires premium subscription');
    }

    return this.areaExplorerService.getMapPins(
      user.id,
      latNum,
      lngNum,
      radius,
      category,
      isFriendsOnly,
    );
  }
}
