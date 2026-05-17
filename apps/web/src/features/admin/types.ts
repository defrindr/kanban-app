export type AdminStats = {
  users: number;
  boards: number;
  lists: number;
  cards: number;
  comments: number;
};

export type DailyActivityMetric = {
  date: string;
  cardCreated: number;
  cardCompleted: number;
  commentAdded: number;
  userActive: number;
};

export type UserEngagementMetric = {
  userId: string;
  username: string;
  avatar: string | null;
  lastActive: string;
  cardsCreated: number;
  commentsAdded: number;
  boardsOwned: number;
  avgActivityPerDay: number;
};

export type BoardUsageMetric = {
  boardId: string;
  boardName: string;
  cardsTotal: number;
  cardsCompleted: number;
  members: number;
  lastActive: string;
  avgCardsPerDay: number;
};

export type AnalyticsData = {
  stats: AdminStats;
  dailyActivity: DailyActivityMetric[];
  userEngagement: UserEngagementMetric[];
  boardUsage: BoardUsageMetric[];
  topContributors: { name: string; avatar: string | null; contributions: number }[];
  mostActiveBoards: { name: string; activity: number }[];
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  createdAt: string;
};

export type AdminBoard = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count: { lists: number; members: number };
};

export type AdminActivity = {
  id: string;
  boardId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
};

export type PaginatedResponse<T> = {
  data?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
