import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UsersService } from './users.service';
import { BindersService } from '../binders/binders.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly bindersService: BindersService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with stats' })
  async getMe(@CurrentUser() user: User) {
    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get public profile of a user' })
  async getProfile(@CurrentUser() user: User, @Param('id') id: string) {
    return this.usersService.getPublicProfile(id, user.id);
  }

  @Get(':id/binders')
  @ApiOperation({ summary: "Get a user's public binders" })
  async getPublicBinders(@Param('id') id: string) {
    return this.bindersService.findPublicByOwner(id);
  }
}
