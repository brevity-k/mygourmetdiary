import { Module } from '@nestjs/common';
import { BindersModule } from '../binders/binders.module';
import { TasteMatchingModule } from '../taste-matching/taste-matching.module';
import { FollowsController } from './follows/follows.controller';
import { FollowsService } from './follows/follows.service';
import { SignalsController } from './signals/signals.controller';
import { SignalsService } from './signals/signals.service';
import { FriendsController } from './friends/friends.controller';
import { FriendsService } from './friends/friends.service';

@Module({
  imports: [BindersModule, TasteMatchingModule],
  controllers: [FollowsController, SignalsController, FriendsController],
  providers: [FollowsService, SignalsService, FriendsService],
  exports: [FollowsService, SignalsService, FriendsService],
})
export class SocialModule {}
