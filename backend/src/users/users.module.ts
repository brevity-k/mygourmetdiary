import { Module } from '@nestjs/common';
import { BindersModule } from '../binders/binders.module';
import { TasteMatchingModule } from '../taste-matching/taste-matching.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [BindersModule, TasteMatchingModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
