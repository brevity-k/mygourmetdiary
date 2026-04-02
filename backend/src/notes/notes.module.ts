import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PioneersModule } from '../pioneers/pioneers.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NotesSearchService } from './notes.search.service';
import { OcrService } from './ocr.service';

@Module({
  imports: [NotificationsModule, PioneersModule],
  controllers: [NotesController],
  providers: [NotesService, NotesSearchService, OcrService],
  exports: [NotesService, NotesSearchService, OcrService],
})
export class NotesModule {}
