import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { SyncService } from './sync.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Premium } from '../common/decorators/premium.decorator';

@ApiTags('sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('export')
  @Premium()
  @ApiOperation({ summary: 'Export notes for offline mode (premium)' })
  @ApiQuery({ name: 'since', required: false, description: 'ISO timestamp for delta sync' })
  @ApiQuery({ name: 'cursor', required: false })
  async exportNotes(
    @CurrentUser() user: User,
    @Query('since') since?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.syncService.exportNotes(user.id, since, cursor);
  }
}
