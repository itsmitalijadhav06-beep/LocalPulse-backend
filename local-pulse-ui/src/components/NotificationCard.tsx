import { Bell, MessageCircle, CheckCircle2, Calendar, ArrowUp } from "lucide-react";
import type { Notification } from "@/types";
import { timeAgo } from "@/utils/format";
import { cn } from "@/lib/utils";

const iconMap = {
  status_updated: Bell,
  comment_added: MessageCircle,
  new_event: Calendar,
  issue_resolved: CheckCircle2,
  new_upvotes: ArrowUp,
} as const;

export function NotificationCard({ notif, onClick }: { notif: Notification; onClick?: () => void }) {
  const Icon = iconMap[notif.type];
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex gap-3 p-4 rounded-2xl border transition-colors",
        onClick && "cursor-pointer hover:border-primary/30",
        notif.read ? "bg-card" : "bg-accent/40 border-primary/20",
      )}>
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-sm">{notif.title}</h4>
          {!notif.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
        </div>
        <p className="text-sm text-muted-foreground">{notif.message}</p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
      </div>
    </div>
  );
}