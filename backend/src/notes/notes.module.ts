import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NotesSearchService } from './notes.search.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, NotesSearchService],
  exports: [NotesService, NotesSearchService],
})
export class NotesModule {}
