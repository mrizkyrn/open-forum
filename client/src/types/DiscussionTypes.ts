import { Attachment } from './AttachmentTypes';
import { User } from './UserTypes';

export interface Discussion {
  id: number;
  content: string;
  isAnonymous: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  author?: User | null;
  attachments: Attachment[];
  commentCount: number;
  upvoteCount: number;
  downvoteCount: number;
  isBookmarked?: boolean;
}