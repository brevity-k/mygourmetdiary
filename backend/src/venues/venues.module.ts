import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { GooglePlacesClient } from './google-places.client';

@Module({
  controllers: [VenuesController],
  providers: [VenuesService, GooglePlacesClient],
  exports: [VenuesService],
})
export class VenuesModule {}
