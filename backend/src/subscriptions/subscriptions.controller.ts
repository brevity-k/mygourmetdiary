import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'RevenueCat webhook receiver' })
  async webhook(
    @Headers('authorization') authHeader: string,
    @Body() body: any,
  ) {
    const expectedKey = this.configService.get<string>('revenuecat.webhookAuthKey');
    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      throw new UnauthorizedException('Invalid webhook auth key');
    }

    const event = body.event;
    if (!event?.type || !event?.app_user_id) {
      this.logger.warn('Malformed RevenueCat webhook payload');
      return { ok: true };
    }

    await this.subscriptionsService.handleWebhook(event);
    return { ok: true };
  }

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription status' })
  async getStatus(@CurrentUser() user: User) {
    return this.subscriptionsService.getStatus(user.id);
  }
}
