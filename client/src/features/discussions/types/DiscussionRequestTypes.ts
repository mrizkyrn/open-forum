export interface CreateDiscussionRequest {
  content: string;
  isAnonymous: boolean;
  tags?: string[];
}
