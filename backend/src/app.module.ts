import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TagsModule } from './tags/tags.module';
import { BindersModule } from './binders/binders.module';
import { VenuesModule } from './venues/venues.module';
import { PhotosModule } from './photos/photos.module';
import { NotesModule } from './notes/notes.module';
import { SearchModule } from './search/search.module';
import { SocialModule } from './social/social.module';
import { TasteMatchingModule } from './taste-matching/taste-matching.module';
import { FirebaseAuthGuard } from './common/guards/firebase-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 1 minute window
      limit: 60,    // 60 requests per minute globally
    }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    TagsModule,
    BindersModule,
    VenuesModule,
    PhotosModule,
    NotesModule,
    SearchModule,
    SocialModule,
    TasteMatchingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
