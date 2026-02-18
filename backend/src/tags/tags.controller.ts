import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { TagCategory } from '@prisma/client';

@ApiTags('tags')
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get tag taxonomy, optionally filtered' })
  @ApiQuery({ name: 'category', enum: TagCategory, required: false })
  @ApiQuery({ name: 'group', required: false })
  async findAll(
    @Query('category') category?: TagCategory,
    @Query('group') group?: string,
  ) {
    return this.tagsService.findAll(category, group);
  }
}
