import { Link } from "@tanstack/react-router";
import { ArrowUp, MessageCircle, MapPin, EyeOff } from "lucide-react";
import type { Issue } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { ISSUE_CATEGORIES } from "@/constants";
import { timeAgo, km } from "@/utils/format";
import { Button } from "./ui/button";
import { IssueImage } from "./IssueImage";

export function IssueCard({ issue }: { issue: Issue }) {
  const cat = ISSUE_CATEGORIES.find((c) => c.value === issue.category);
  return (
    <article className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link to="/issues/$id" params={{ id: issue.id }} className="block w-full overflow-hidden bg-muted">
        <IssueImage
          src={issue.imageUrl}
          alt={issue.title}
          category={issue.category}
          className="w-full h-[220px] object-cover rounded-t-2xl"
        />
      </Link>
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            <span>{cat?.emoji}</span> {cat?.label}
          </span>
          <StatusBadge status={issue.status} />
          {issue.anonymous && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
              <EyeOff className="h-3 w-3" /> Anonymous
            </span>
          )}
        </div>
        <Link to="/issues/$id" params={{ id: issue.id }}>
          <h3 className="font-semibold text-base leading-snug line-clamp-2 hover:text-primary">
            {issue.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{issue.address}</span>
          <span>•</span>
          <span className="shrink-0">{km(issue.distanceKm)}</span>
          <span>•</span>
          <span className="shrink-0">{timeAgo(issue.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {issue.reporter && !issue.anonymous ? (
              <>
                <img src={issue.reporter.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
                <span className="text-xs font-medium">{issue.reporter.name}</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Reported anonymously</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-8 px-2 gap-1">
              <ArrowUp className="h-4 w-4" /> {issue.upvotes}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 gap-1">
              <MessageCircle className="h-4 w-4" /> {issue.commentsCount}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
