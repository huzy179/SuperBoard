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

export class CreateChannelDto {
  name!: string;
  description?: string;
  type!: 'PUBLIC' | 'PRIVATE';
  memberIds?: string[];
}

export class CreateDmDto {
  otherUserId!: string;
}

export class UpdateChannelDto {
  name?: string;
  description?: string;
}

export class AddChannelMemberDto {
  userId!: string;
}
