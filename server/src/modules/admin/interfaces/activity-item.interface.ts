interface ActivityItem {
  id: string;
  type: string;
  user: {
    id: number;
    name: string;
    avatarUrl: string;
  } | null;
  action: string;
  target?: {
    id: number;
    title: string;
    type: string;
  };
  createdAt: Date;
  details?: string;
}
