export interface CreateCommentRequest {
  content: string;
  discussionId: number;
  parentId?: number | null;
}

export interface UpdateCommentRequest {
  content: string;
}
