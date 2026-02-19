import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { MenuDeciderService } from './menu-decider.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Premium } from '../common/decorators/premium.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('menu-decider')
@ApiBearerAuth()
@Controller('menu-decider')
export class MenuDeciderController {
  constructor(
    private readonly menuDeciderService: MenuDeciderService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':venueId')
  @Premium()
  @ApiOperation({ summary: 'Get dish recommendations for a venue (premium)' })
  async getRecommendations(
    @CurrentUser() user: User,
    @Param('venueId') venueId: string,
  ) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Venue not found');
    return this.menuDeciderService.getDishRecommendations(user.id, venueId);
  }

  @Get(':venueId/summary')
  @ApiOperation({ summary: 'Get basic venue summary (public)' })
  async getSummary(
    @CurrentUser() user: User,
    @Param('venueId') venueId: string,
  ) {
    const result = await this.menuDeciderService.getDishRecommendations(user.id, venueId);
    return {
      venue: result.venue,
      dishCount: result.dishes.length,
      hasFriendData: result.hasFriendData,
      topDish: result.dishes[0]?.dishName ?? null,
    };
  }
}
