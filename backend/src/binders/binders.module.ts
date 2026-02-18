import { Module } from '@nestjs/common';
import { BindersController } from './binders.controller';
import { BindersService } from './binders.service';

@Module({
  controllers: [BindersController],
  providers: [BindersService],
  exports: [BindersService],
})
export class BindersModule {}
