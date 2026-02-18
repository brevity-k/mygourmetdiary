import { BadRequestException } from '@nestjs/common';
import { NoteType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  RestaurantExtensionDto,
  WineExtensionDto,
  SpiritExtensionDto,
  WineryVisitExtensionDto,
} from '../dto/extensions.dto';

const extensionMap = {
  [NoteType.RESTAURANT]: RestaurantExtensionDto,
  [NoteType.WINE]: WineExtensionDto,
  [NoteType.SPIRIT]: SpiritExtensionDto,
  [NoteType.WINERY_VISIT]: WineryVisitExtensionDto,
};

export class NoteExtensionFactory {
  static validate(type: NoteType, extension: Record<string, unknown>): void {
    const DtoClass = extensionMap[type];
    if (!DtoClass) {
      throw new BadRequestException(`Unknown note type: ${type}`);
    }

    const instance = plainToInstance(DtoClass as any, extension);
    const errors = validateSync(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((e) =>
        Object.values(e.constraints || {}),
      );
      throw new BadRequestException({
        message: 'Invalid extension data',
        errors: messages,
      });
    }
  }
}
