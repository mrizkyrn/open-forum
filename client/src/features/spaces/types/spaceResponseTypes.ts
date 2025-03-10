export interface Space {
  id: number;
  name: string;
  description: string;
  slug: string;
  creatorId: number;
  iconUrl?: string | null;
  bannerUrl?: string | null;
  followerCount: number;
  isFollowing: boolean;
  createdAt: Date;
  updatedAt: Date;
}