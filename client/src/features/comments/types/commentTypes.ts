import { User } from "@/features/users/types/UserTypes";
import { Attachment } from "@/types/AttachmentTypes";

export interface Comment {
  id: number;
  content: string;
  author: User;
  discussionId: number;
  parentId: number | null;
  replies?: Comment[];
  replyCount: number;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
}