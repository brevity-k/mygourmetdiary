import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { User, TasteCategory } from '@prisma/client';
import { UserDiscoveryService } from './user-discovery.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('discover')
@ApiBearerAuth()
@Controller('discover')
export class UserDiscoveryController {
  constructor(private readonly discoveryService: UserDiscoveryService) {}

  @Get('similar-users')
  @ApiOperation({ summary: 'Discover users with similar taste' })
  @ApiQuery({ name: 'category', enum: TasteCategory, required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getSimilarUsers(
    @CurrentUser() user: User,
    @Query('category') category?: TasteCategory,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const safeLimit = Math.min(Math.max(limit || 20, 1), 100);
    const safeOffset = Math.max(offset || 0, 0);
    return this.discoveryService.getSimilarUsers(user.id, category, safeLimit, safeOffset);
  }
}
