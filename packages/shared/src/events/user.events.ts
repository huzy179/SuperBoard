export interface UserInvitedPayload {
  inviteeEmail: string;
  inviterId: string;
  workspaceId: string;
  workspaceName: string;
  token: string;
}

export interface UserMemberJoinedPayload {
  userId: string;
  workspaceId: string;
  role: string;
  joinedAt: string;
}
