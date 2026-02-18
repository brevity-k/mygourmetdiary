import { Module } from '@nestjs/common';
import { TssComputationService } from './tss-computation.service';
import { TssBatchJob } from './tss-batch.job';
import { TssCacheService } from './tss-cache.service';
import { UserDiscoveryController } from './user-discovery.controller';
import { UserDiscoveryService } from './user-discovery.service';

@Module({
  controllers: [UserDiscoveryController],
  providers: [
    TssComputationService,
    TssBatchJob,
    TssCacheService,
    UserDiscoveryService,
  ],
  exports: [TssComputationService, TssCacheService],
})
export class TasteMatchingModule {}
