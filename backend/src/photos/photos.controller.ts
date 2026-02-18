import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { PhotosService } from './photos.service';
import { PresignPhotoDto } from './dto/presign-photo.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('photos')
@ApiBearerAuth()
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Get a presigned upload URL for R2' })
  async presign(@CurrentUser() user: User, @Body() dto: PresignPhotoDto) {
    return this.photosService.presign(user.id, dto.mimeType, dto.sizeBytes);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a photo' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.photosService.remove(id, user.id);
  }
}
