import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { NotesSearchService } from '../notes/notes.search.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: NotesSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search own notes via full-text search' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async search(
    @CurrentUser() user: User,
    @Query('q') q: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.searchService.search(
      user.id,
      q,
      type,
      limit || 20,
      offset || 0,
    );
  }
}
