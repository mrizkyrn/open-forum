// Input DTOs
export { CreateDiscussionSpaceDto } from './create-discussion-space.dto';
export { CreateDiscussionDto } from './create-discussion.dto';
export { DiscussionSortBy, SearchDiscussionDto } from './search-discussion.dto';
export { SearchSpaceDto, SpaceSortBy } from './search-space.dto';
export { UpdateDiscussionSpaceDto } from './update-discussion-space.dto';
export { UpdateDiscussionDto } from './update-discussion.dto';

// Response DTOs
export { DiscussionResponseDto } from './discussion-response.dto';
export { DiscussionSpaceResponseDto } from './discussion-space-response.dto';

// Re-export validation types for external use
export type { SpaceType } from '../entities/discussion-space.entity';
