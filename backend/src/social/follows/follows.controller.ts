import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { FollowsService } from './follows.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('follows')
@ApiBearerAuth()
@Controller()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('binders/:binderId/follow')
  @ApiOperation({ summary: 'Follow a public binder' })
  async follow(@CurrentUser() user: User, @Param('binderId') binderId: string) {
    return this.followsService.follow(user.id, binderId);
  }

  @Delete('binders/:binderId/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfollow a binder' })
  async unfollow(@CurrentUser() user: User, @Param('binderId') binderId: string) {
    await this.followsService.unfollow(user.id, binderId);
  }

  @Get('users/me/following')
  @ApiOperation({ summary: 'List binders the current user follows' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowing(
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    const safeLimit = Math.min(Math.max(limit || 20, 1), 100);
    return this.followsService.getFollowing(user.id, cursor, safeLimit);
  }
}
