import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { NotesModule } from '../notes/notes.module';
import { TasteMatchingModule } from '../taste-matching/taste-matching.module';

@Module({
  imports: [NotesModule, TasteMatchingModule],
  controllers: [SearchController],
})
export class SearchModule {}
