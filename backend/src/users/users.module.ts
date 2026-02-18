import { Module } from '@nestjs/common';
import { BindersModule } from '../binders/binders.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [BindersModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
