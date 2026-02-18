import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User, SignalType } from '@prisma/client';
import { SignalsService } from './signals.service';
import { CreateSignalDto } from './dto/create-signal.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('signals')
@ApiBearerAuth()
@Controller('notes/:noteId/signals')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a taste signal (Bookmark/Echo/Diverge)' })
  async sendSignal(
    @CurrentUser() user: User,
    @Param('noteId') noteId: string,
    @Body() dto: CreateSignalDto,
  ) {
    return this.signalsService.sendSignal(user.id, noteId, dto);
  }

  @Delete(':signalType')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a taste signal' })
  async removeSignal(
    @CurrentUser() user: User,
    @Param('noteId') noteId: string,
    @Param('signalType') signalType: SignalType,
  ) {
    await this.signalsService.removeSignal(user.id, noteId, signalType);
  }

  @Get()
  @ApiOperation({ summary: 'Get signal counts and viewer signals for a note' })
  async getSignals(
    @CurrentUser() user: User,
    @Param('noteId') noteId: string,
  ) {
    return this.signalsService.getSignalSummary(noteId, user.id);
  }
}
