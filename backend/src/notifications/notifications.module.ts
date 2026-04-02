import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ExpoPushClient } from './expo-push.client';
import { EmailService } from './email.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, ExpoPushClient, EmailService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
