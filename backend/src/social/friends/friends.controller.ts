import {
  Controller,
  Post,
  Delete,
  Patch,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { FriendsService } from './friends.service';
import { PinFriendDto, UpdatePinDto } from './dto/pin-friend.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('friends')
@ApiBearerAuth()
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('pin')
  @ApiOperation({ summary: 'Pin a user as Gourmet Friend' })
  async pin(@CurrentUser() user: User, @Body() dto: PinFriendDto) {
    return this.friendsService.pinFriend(user.id, dto);
  }

  @Delete('pin/:pinnedId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unpin a Gourmet Friend' })
  async unpin(@CurrentUser() user: User, @Param('pinnedId') pinnedId: string) {
    await this.friendsService.unpinFriend(user.id, pinnedId);
  }

  @Patch('pin/:pinnedId')
  @ApiOperation({ summary: 'Update pinned categories for a Gourmet Friend' })
  async updatePin(
    @CurrentUser() user: User,
    @Param('pinnedId') pinnedId: string,
    @Body() dto: UpdatePinDto,
  ) {
    return this.friendsService.updatePin(user.id, pinnedId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List pinned Gourmet Friends with TSS scores' })
  async listFriends(@CurrentUser() user: User) {
    return this.friendsService.listFriends(user.id);
  }

  @Get(':userId/compatibility')
  @ApiOperation({ summary: 'Get TSS breakdown with a specific user' })
  async compatibility(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ) {
    return this.friendsService.getCompatibility(user.id, userId);
  }

  @Get(':userId/can-pin')
  @ApiOperation({ summary: 'Check if a user can be pinned' })
  async canPin(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ) {
    return this.friendsService.canPin(user.id, userId);
  }
}
