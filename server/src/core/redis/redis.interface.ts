/**
 * Comment created event data
 */
export interface CommentCreatedEvent {
  commentId: number;
  discussionId: number;
  spaceId: number;
  authorId: number;
  content: string;
  parentId?: number | null;
  hasAttachments?: boolean;
}

/**
 * Type guard functions
 */
export function isCommentCreatedEvent(event: any): event is CommentCreatedEvent {
  return event && 
    typeof event.commentId === 'number' && 
    typeof event.discussionId === 'number' && 
    typeof event.authorId === 'number';
}