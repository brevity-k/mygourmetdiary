import { Controller, Get, Post, Patch, Delete, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterTokenDto } from './dto/register-token.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('token')
  @ApiOperation({ summary: 'Register or update push token' })
  async registerToken(
    @CurrentUser() user: User,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notificationsService.registerToken(user.id, dto.token, dto.platform);
  }

  @Delete('token')
  @ApiOperation({ summary: 'Remove push tokens (on logout)' })
  async removeToken(@CurrentUser() user: User) {
    await this.notificationsService.removeTokensForUser(user.id);
    return { ok: true };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@CurrentUser() user: User) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.id, dto);
  }
}
