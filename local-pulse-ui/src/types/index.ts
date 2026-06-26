export type IssueStatus = "open" | "under_review" | "in_progress" | "resolved";
export type IssueCategory = "road" | "water" | "electricity" | "safety" | "sanitation" | "other";
export type ProviderCategory = "plumber" | "electrician" | "tutor" | "carpenter" | "mechanic" | "cleaner";
export type NotificationType = "status_updated" | "comment_added" | "new_event" | "issue_resolved" | "new_upvotes";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  city: string;
  contributionScore: number;
  reportsCount: number;
  upvotesGiven: number;
  role?: "citizen" | "admin" | "provider" | "authority";
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Comment {
  id: string;
  issueId: string;
  author: Pick<User, "id" | "name" | "avatarUrl">;
  text: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  imageUrl?: string;
  location: GeoPoint;
  address: string;
  distanceKm: number;
  createdAt: string;
  upvotes: number;
  commentsCount: number;
  reporter: Pick<User, "id" | "name" | "avatarUrl"> | null;
  anonymous: boolean;
  // AI placeholders — populated by backend later
  aiCategory?: IssueCategory;
  aiSeverity?: "low" | "medium" | "high";
  aiDescription?: string;
  duplicateOf?: string | null;
}

export interface Event {
  id: string;
  title: string;
  posterUrl?: string;
  date: string;
  time: string;
  organizer: string;
  location: GeoPoint;
  address: string;
  distanceKm: number;
  interestedCount: number;
  category?: string;
}

export interface Provider {
  id: string;
  name: string;
  photoUrl?: string;
  category: ProviderCategory;
  rating: number;
  reviewsCount: number;
  phone: string;
  address: string;
  distanceKm: number;
  verified?: boolean;
  contact_email?: string;
  contact_phone?: string;
  service_radius_km?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  refId?: string;
}

export interface AdminStats {
  totalReports: number;
  openIssues: number;
  resolvedIssues: number;
  events: number;
  users: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}