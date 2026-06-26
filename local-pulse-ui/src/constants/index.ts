import type { IssueCategory, IssueStatus, ProviderCategory } from "@/types";

export const ISSUE_CATEGORIES: { value: IssueCategory; label: string; emoji: string }[] = [
  { value: "road", label: "Road", emoji: "🛣️" },
  { value: "water", label: "Water", emoji: "💧" },
  { value: "electricity", label: "Electricity", emoji: "⚡" },
  { value: "safety", label: "Safety", emoji: "🛡️" },
  { value: "sanitation", label: "Sanitation", emoji: "🧹" },
  { value: "other", label: "Other", emoji: "📌" },
];

export const PROVIDER_CATEGORIES: { value: ProviderCategory; label: string; emoji: string }[] = [
  { value: "plumber", label: "Plumber", emoji: "🔧" },
  { value: "electrician", label: "Electrician", emoji: "💡" },
  { value: "tutor", label: "Tutor", emoji: "📚" },
  { value: "carpenter", label: "Carpenter", emoji: "🪚" },
  { value: "mechanic", label: "Mechanic", emoji: "🔩" },
  { value: "cleaner", label: "Cleaner", emoji: "🧽" },
];

export const STATUS_LABEL: Record<IssueStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const RADIUS_OPTIONS = [1, 3, 5, 10] as const;
