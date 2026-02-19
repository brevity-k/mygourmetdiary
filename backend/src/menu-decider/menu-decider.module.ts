import { Module } from '@nestjs/common';
import { TasteMatchingModule } from '../taste-matching/taste-matching.module';
import { MenuDeciderController } from './menu-decider.controller';
import { MenuDeciderService } from './menu-decider.service';

@Module({
  imports: [TasteMatchingModule],
  controllers: [MenuDeciderController],
  providers: [MenuDeciderService],
})
export class MenuDeciderModule {}
