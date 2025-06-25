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

export function isCommentCreatedEvent(event: any): event is CommentCreatedEvent {
  return (
    event &&
    typeof event.commentId === 'number' &&
    typeof event.discussionId === 'number' &&
    typeof event.authorId === 'number'
  );
}

/**
 * Vote updated event data
 */
export interface VoteUpdatedEvent {
  userId: number;
  recipientId: number;
  shouldNotify: boolean;
  entityType: string;
  entityId: number;
  voteAction: 'added' | 'removed' | 'changed';
  voteValue: number;
  discussionId: number;
}

export function isVoteUpdatedEvent(event: any): event is VoteUpdatedEvent {
  return (
    event &&
    typeof event.userId === 'number' &&
    typeof event.entityId === 'number' &&
    typeof event.entityType === 'string' &&
    typeof event.voteAction === 'string' &&
    typeof event.voteValue === 'number'
  );
}

/**
 * Report handled event data
 */
export interface ReportReviewedEvent {
  reportId: number;
  reportStatus: string;
  reviewerId: number;
  reporterId: number;
  targetAuthorId: number | null;
  targetType: string;
  targetId: number;
  contentPreview: string;
  discussionId: number | null;
  isContentDeleted: boolean;
  note: string;
  reasonText: string;
  notifyReporter?: boolean;
  notifyAuthor?: boolean;
}

export function isReportReviewedEvent(event: any): event is ReportReviewedEvent {
  return (
    event &&
    (typeof event.reportId === 'number' || !isNaN(Number(event.reportId))) &&
    (typeof event.reviewerId === 'number' || !isNaN(Number(event.reviewerId))) &&
    (typeof event.reporterId === 'number' || !isNaN(Number(event.reporterId))) &&
    typeof event.targetType === 'string'
  );
}
