import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  newNoteInFollowed?: boolean;

  @IsOptional()
  @IsBoolean()
  signalOnMyNote?: boolean;

  @IsOptional()
  @IsBoolean()
  newGourmetFriend?: boolean;

  @IsOptional()
  @IsBoolean()
  pioneerAlert?: boolean;
}
