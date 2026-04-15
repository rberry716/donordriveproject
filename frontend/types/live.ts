export type DonationFeedItem = {
  donationID: string | number;
  amount: number;
  displayName?: string | null;
  nameVisibility?: string | null;
  createdDateUTC?: string;
};

export type LeaderboardEntry = {
  id: string | number;
  name: string;
  amount: number;
};

export type LeaderboardDirection = "up" | "down" | "same" | "new" | "dropped";

export type LeaderboardDiffEntry = {
  id: string | number;
  name: string;
  amount: number;
  prevRank?: number | null;
  newRank?: number | null;
  direction: LeaderboardDirection;
  magnitude: number;
};

export type LeaderboardSnapshot = {
  rankings: LeaderboardEntry[];
  diff: LeaderboardDiffEntry[];
};

export type HourlySummary = {
  total: number;
  count: number;
  hourStart?: number;
};

export type CampaignSnapshot = {
  amount: number;
  goal?: number | null;
};

export type LiveDataState = {
  donations: DonationFeedItem[];
  teams: LeaderboardSnapshot | null;
  participants: LeaderboardSnapshot | null;
  hourly: HourlySummary | null;
  campaign: CampaignSnapshot | null;
};
