import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { User, NoteType } from '@prisma/client';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get personal note feed (cursor-paginated)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', enum: NoteType, required: false })
  @ApiQuery({ name: 'binderId', required: false })
  async feed(
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('type') type?: NoteType,
    @Query('binderId') binderId?: string,
  ) {
    const safeLimit = Math.min(Math.max(limit || 20, 1), 100);
    return this.notesService.feed(user.id, cursor, safeLimit, type, binderId);
  }

  @Get('public/feed')
  @ApiOperation({ summary: 'Public notes from all users (cursor-paginated)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', enum: NoteType, required: false })
  async publicFeed(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('type') type?: NoteType,
  ) {
    const safeLimit = Math.min(Math.max(limit || 20, 1), 100);
    return this.notesService.publicFeed(cursor, safeLimit, type);
  }

  @Get('social/feed')
  @ApiOperation({ summary: 'Notes from followed binders' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', enum: NoteType, required: false })
  async socialFeed(
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('type') type?: NoteType,
  ) {
    const safeLimit = Math.min(Math.max(limit || 20, 1), 100);
    return this.notesService.socialFeed(user.id, cursor, safeLimit, type);
  }

  @Get('public/:id')
  @ApiOperation({ summary: 'View a specific public note' })
  async findPublic(@Param('id') id: string) {
    return this.notesService.findPublicById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  async create(@CurrentUser() user: User, @Body() dto: CreateNoteDto) {
    return this.notesService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notesService.findById(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.notesService.remove(id, user.id);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Attach photos to a note' })
  async attachPhotos(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('photoIds') photoIds: string[],
  ) {
    return this.notesService.attachPhotos(id, user.id, photoIds);
  }
}
