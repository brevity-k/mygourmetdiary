import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { NotesModule } from '../notes/notes.module';

@Module({
  imports: [NotesModule],
  controllers: [SearchController],
})
export class SearchModule {}
