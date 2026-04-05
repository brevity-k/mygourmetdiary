import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PioneersModule } from '../pioneers/pioneers.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NotesSearchService } from './notes.search.service';

@Module({
  imports: [NotificationsModule, PioneersModule],
  controllers: [NotesController],
  providers: [NotesService, NotesSearchService],
  exports: [NotesService, NotesSearchService],
})
export class NotesModule {}
