export class SendMessageDto {
  content!: string;
  parentId?: string;
}

export class UpdateMessageDto {
  content!: string;
}

export class AddReactionDto {
  emoji!: string;
}
