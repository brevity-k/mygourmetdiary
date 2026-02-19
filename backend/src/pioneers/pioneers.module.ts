import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PioneersController } from './pioneers.controller';
import { PioneersService } from './pioneers.service';

@Module({
  imports: [NotificationsModule],
  controllers: [PioneersController],
  providers: [PioneersService],
  exports: [PioneersService],
})
export class PioneersModule {}
