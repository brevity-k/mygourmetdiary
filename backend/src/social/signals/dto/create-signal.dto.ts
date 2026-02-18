import {
  IsEnum,
  IsInt,
  Min,
  Max,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { SignalType } from '@prisma/client';

export class CreateSignalDto {
  @IsEnum(SignalType)
  signalType!: SignalType;

  @ValidateIf((o) => o.signalType === SignalType.ECHOED || o.signalType === SignalType.DIVERGED)
  @IsNotEmpty({ message: 'senderRating is required for ECHOED and DIVERGED signals' })
  @IsInt()
  @Min(1)
  @Max(10)
  senderRating?: number;
}
