import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowUp, MessageCircle, MapPin, Share2, EyeOff, Sparkles, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { MapView } from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonCard } from "@/components/SkeletonCard";
import { issueService } from "@/services/issue.service";
import { ISSUE_CATEGORIES, STATUS_LABEL } from "@/constants";
import { timeAgo, km } from "@/utils/format";

export const Route = createFileRoute("/issues/$id")({
  head: () => ({ meta: [{ title: "Issue Details — LocalPulse" }] }),
  component: IssueDetailsPage,
});

import { useRouteGuard } from "@/hooks/useRouteGuard";

function IssueDetailsPage() {
  const { isLoading: guardLoading } = useRouteGuard(["citizen", "admin"]);
  const { id } = useParams({ from: "/issues/$id" });
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: issue, isLoading, isError } = useQuery({
    queryKey: ["issue", id],
    queryFn: () => issueService.get(id).then((res) => res.data.data),
    enabled: !guardLoading,
  });

  const upvoteMutation = useMutation({
    mutationFn: () => issueService.upvote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issue", id] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => issueService.comment(id, commentText),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["issue", id] });
    },
  });

  if (guardLoading || isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-5xl mx-auto pt-6 text-center">
          {guardLoading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Checking permissions...</p>
            </div>
          ) : (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
        </div>
      </AppShell>
    );
  }

  if (isError || !issue) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto">
          <Link to="/feed" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to feed
          </Link>
          <p className="mt-6 text-destructive text-sm">Couldn't load this issue. It may have been removed.</p>
        </div>
      </AppShell>
    );
  }

  const cat = ISSUE_CATEGORIES.find((c) => c.value === issue.category);
  const timeline = [
    { status: "open", label: STATUS_LABEL.open },
    { status: "under_review", label: STATUS_LABEL.under_review },
    { status: "in_progress", label: STATUS_LABEL.in_progress },
    { status: "resolved", label: STATUS_LABEL.resolved },
  ] as const;
  const currentIdx = ["open", "under_review", "in_progress", "resolved"].indexOf(issue.status);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Link to="/feed" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden border bg-card">
              {issue.imageUrl && <img src={issue.imageUrl} alt={issue.title} className="w-full aspect-[16/9] object-cover" />}
              <div className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                    {cat?.emoji} {cat?.label}
                  </span>
                  <StatusBadge status={issue.status} />
                  {issue.anonymous && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                      <EyeOff className="h-3 w-3" /> Anonymous
                    </span>
                  )}
                  {issue.aiSeverity && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
                      <Sparkles className="h-3 w-3" /> AI severity: {issue.aiSeverity}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold">{issue.title}</h1>
                <p className="text-muted-foreground">{issue.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{issue.address}</span>
                  <span>•</span>
                  <span>{km(issue.distanceKm)}</span>
                  <span>•</span>
                  <span>{timeAgo(issue.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t">
                  <Button
                    className="gap-1.5"
                    disabled={upvoteMutation.isPending}
                    onClick={() => upvoteMutation.mutate()}
                  >
                    {upvoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                    Upvote · {issue.upvotes}
                  </Button>
                  <Button variant="outline" className="gap-1.5" onClick={() => document.getElementById("comment-box")?.focus()}>
                    <MessageCircle className="h-4 w-4" /> Comment
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigator.share?.({ url: window.location.href, title: issue.title })}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <section className="bg-card border rounded-2xl p-5">
              <h2 className="font-bold text-lg">Status Timeline</h2>
              <ol className="mt-5 space-y-5">
                {timeline.map((t, i) => {
                  const done = i <= currentIdx;
                  return (
                    <li key={t.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={"h-8 w-8 rounded-full grid place-items-center text-xs font-bold " + (done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          {i + 1}
                        </div>
                        {i < timeline.length - 1 && <div className={"w-0.5 flex-1 mt-1 " + (done ? "bg-primary" : "bg-border")} style={{ minHeight: 24 }} />}
                      </div>
                      <div className="pb-2">
                        <div className={"font-semibold " + (done ? "" : "text-muted-foreground")}>{t.label}</div>
                        <div className="text-xs text-muted-foreground">{done && i === currentIdx ? "Current status" : done ? "Completed" : "Pending"}</div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="bg-card border rounded-2xl p-5">
              <h2 className="font-bold text-lg">Comments ({issue.commentsCount})</h2>
              <div className="mt-4 space-y-4">
                <div className="pt-2 border-t">
                  <Textarea
                    id="comment-box"
                    placeholder="Add a comment..."
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      disabled={commentMutation.isPending || !commentText.trim()}
                      onClick={() => commentMutation.mutate()}
                    >
                      {commentMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Post comment
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-bold">Location</h3>
              <div className="mt-3">
                <MapView center={issue.location} markers={[{ position: issue.location, title: issue.title }]} height={220} />
              </div>
              <p className="text-xs text-muted-foreground mt-3">{issue.address}</p>
            </div>
            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-bold">Reporter</h3>
              {issue.reporter && !issue.anonymous ? (
                <div className="flex items-center gap-3 mt-3">
                  {issue.reporter.avatarUrl && <img src={issue.reporter.avatarUrl} className="h-10 w-10 rounded-full" alt="" />}
                  <div>
                    <div className="font-semibold text-sm">{issue.reporter.name}</div>
                    <div className="text-xs text-muted-foreground">Citizen Reporter</div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground inline-flex items-center gap-2">
                  <EyeOff className="h-4 w-4" /> Reported anonymously
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
