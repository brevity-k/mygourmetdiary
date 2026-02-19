import { Module } from '@nestjs/common';
import { TasteMatchingModule } from '../taste-matching/taste-matching.module';
import { AreaExplorerController } from './area-explorer.controller';
import { AreaExplorerService } from './area-explorer.service';

@Module({
  imports: [TasteMatchingModule],
  controllers: [AreaExplorerController],
  providers: [AreaExplorerService],
})
export class AreaExplorerModule {}
