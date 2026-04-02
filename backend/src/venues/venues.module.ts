import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { GooglePlacesClient } from './google-places.client';
import { CityLookupService } from './city-lookup.service';

@Module({
  controllers: [VenuesController],
  providers: [VenuesService, GooglePlacesClient, CityLookupService],
  exports: [VenuesService, CityLookupService],
})
export class VenuesModule {}
