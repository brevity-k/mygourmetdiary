import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { BindersService } from './binders.service';
import { CreateBinderDto } from './dto/create-binder.dto';
import { UpdateBinderDto } from './dto/update-binder.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('binders')
@ApiBearerAuth()
@Controller('binders')
export class BindersController {
  constructor(private readonly bindersService: BindersService) {}

  @Get()
  @ApiOperation({ summary: 'List all binders for current user' })
  async findAll(@CurrentUser() user: User) {
    return this.bindersService.findAllByOwner(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new binder' })
  async create(@CurrentUser() user: User, @Body() dto: CreateBinderDto) {
    return this.bindersService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a binder by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bindersService.findById(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a binder' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateBinderDto,
  ) {
    return this.bindersService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a binder (non-default only)' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.bindersService.remove(id, user.id);
  }
}
