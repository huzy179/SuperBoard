import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class AddReactionDto {
  @IsString()
  @IsNotEmpty()
  emoji!: string;
}
