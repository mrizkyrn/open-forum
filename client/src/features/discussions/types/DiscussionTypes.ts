import { Attachment } from '../../../types/AttachmentTypes';
import { User } from '../../users/types/UserTypes';

export interface Discussion {
  id: number;
  content: string;
  isAnonymous: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  author?: User | null;
  space: {
    id: number;
    name: string;
    slug: string;
  };
  attachments: Attachment[];
  commentCount: number;
  upvoteCount: number;
  downvoteCount: number;
  isBookmarked?: boolean;
  voteStatus?: number | null;
}
