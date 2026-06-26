import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  MessageCircle,
  MapPin,
  Share2,
  EyeOff,
  Sparkles,
  Loader2,
  Trash2,
  Clock,
  MessageSquarePlus,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { MapView } from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonCard } from "@/components/SkeletonCard";
import { IssueImage } from "@/components/IssueImage";
import { issueService } from "@/services/issue.service";
import { commentService } from "@/services/comment.service";
import { ISSUE_CATEGORIES, STATUS_LABEL } from "@/constants";
import { timeAgo, km } from "@/utils/format";
import { useApp } from "@/contexts/AppContext";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { toast } from "sonner";

export const Route = createFileRoute("/issues/$id")({
  head: () => ({ meta: [{ title: "Issue Details — LocalPulse" }] }),
  component: IssueDetailsPage,
});

function IssueDetailsPage() {
  const { isLoading: guardLoading } = useRouteGuard(["citizen", "admin"]);
  const { id } = useParams({ from: "/issues/$id" });
  const { user } = useApp();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const isAdmin = user?.role === "admin";

  // ── Issue query ────────────────────────────────────────────────────────────
  const {
    data: issue,
    isLoading: issueLoading,
    isError: issueError,
  } = useQuery({
    queryKey: ["issue", id],
    queryFn: () => issueService.get(id).then((res) => res.data.data),
    enabled: !guardLoading,
  });

  // ── Comments query ─────────────────────────────────────────────────────────
  // Backend: GET /comments/{issue_id}
  const {
    data: comments = [],
    isLoading: commentsLoading,
  } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => commentService.list(id).then((res) => res.data.data),
    enabled: !guardLoading,
    // Re-fetch automatically when window regains focus
    refetchOnWindowFocus: true,
  });

  // ── Upvote mutation ────────────────────────────────────────────────────────
  const upvoteMutation = useMutation({
    mutationFn: () => issueService.upvote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", id] });
    },
    onError: () => toast.error("Failed to upvote. Please try again."),
  });

  // ── Comment create mutation ────────────────────────────────────────────────
  // Backend: POST /comments/{issue_id}
  // Body:    { "content": "<string>" }   ← required field name is "content"
  const commentMutation = useMutation({
    mutationFn: (text: string) => commentService.create(id, text),
    onSuccess: () => {
      // 1. Clear textarea immediately
      setCommentText("");
      // 2. Refresh the comments list
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      // 3. Refresh issue (to update commentsCount)
      queryClient.invalidateQueries({ queryKey: ["issue", id] });
      toast.success("Comment posted!");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail?.[0]?.msg ||
        err?.response?.data?.detail ||
        "Failed to post comment. Please try again.";
      toast.error(String(msg));
    },
  });

  // ── Comment delete mutation ────────────────────────────────────────────────
  // Backend: DELETE /comments/{comment_id}
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentService.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["issue", id] });
      toast.success("Comment deleted.");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        "Failed to delete comment. You may not be authorized.";
      toast.error(String(msg));
    },
  });

  const handlePostComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) {
      toast.error("Comment cannot be empty.");
      return;
    }
    if (trimmed.length > 500) {
      toast.error("Comment must be 500 characters or fewer.");
      return;
    }
    commentMutation.mutate(trimmed);
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (guardLoading || issueLoading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-5xl mx-auto pt-6 text-center">
          {guardLoading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Checking permissions...
              </p>
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

  if (issueError || !issue) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto">
          <Link
            to="/feed"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to feed
          </Link>
          <p className="mt-6 text-destructive text-sm">
            Couldn't load this issue. It may have been removed.
          </p>
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
  const currentIdx = [
    "open",
    "under_review",
    "in_progress",
    "resolved",
  ].indexOf(issue.status);

  const canDeleteComment = (c: any) =>
    isAdmin || c.isOwn || c.author?.id === user?.id;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* ── Main content ── */}
          <div className="space-y-6">
            {/* Issue card */}
            <div className="rounded-2xl overflow-hidden border bg-card">
              <IssueImage
                src={issue.imageUrl}
                alt={issue.title}
                category={issue.category}
                className="w-full aspect-[16/9] object-cover"
              />
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
                      <Sparkles className="h-3 w-3" /> AI severity:{" "}
                      {issue.aiSeverity}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold">
                  {issue.title}
                </h1>
                <p className="text-muted-foreground">{issue.description}</p>

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{issue.address}</span>
                  <span>•</span>
                  <span>{km(issue.distanceKm)}</span>
                  <span>•</span>
                  <span>{timeAgo(issue.createdAt)}</span>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t flex-wrap">
                  {!isAdmin && (
                    <Button
                      className="gap-1.5"
                      disabled={upvoteMutation.isPending}
                      onClick={() => upvoteMutation.mutate()}
                    >
                      {upvoteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                      Upvote · {issue.upvotes}
                    </Button>
                  )}
                  {isAdmin && (
                    <span className="text-sm font-semibold text-muted-foreground">
                      ↑ {issue.upvotes} upvotes
                    </span>
                  )}
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() =>
                      document.getElementById("comment-box")?.focus()
                    }
                  >
                    <MessageCircle className="h-4 w-4" />
                    Comments ({comments.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      navigator.share?.({
                        url: window.location.href,
                        title: issue.title,
                      })
                    }
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <section className="bg-card border rounded-2xl p-5">
              <h2 className="font-bold text-lg">Status Timeline</h2>
              <ol className="mt-5 space-y-5">
                {timeline.map((t, i) => {
                  const done = i <= currentIdx;
                  return (
                    <li key={t.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={
                            "h-8 w-8 rounded-full grid place-items-center text-xs font-bold " +
                            (done
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground")
                          }
                        >
                          {i + 1}
                        </div>
                        {i < timeline.length - 1 && (
                          <div
                            className={
                              "w-0.5 flex-1 mt-1 " +
                              (done ? "bg-primary" : "bg-border")
                            }
                            style={{ minHeight: 24 }}
                          />
                        )}
                      </div>
                      <div className="pb-2">
                        <div
                          className={
                            "font-semibold " +
                            (done ? "" : "text-muted-foreground")
                          }
                        >
                          {t.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {done && i === currentIdx
                            ? "Current status"
                            : done
                            ? "Completed"
                            : "Pending"}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* ── Comments section ── */}
            <section className="bg-card border rounded-2xl p-5">
              <h2 className="font-bold text-lg mb-4">
                Comments ({comments.length})
              </h2>

              {/* Comment list */}
              {commentsLoading ? (
                <div className="space-y-4 mb-5">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-24" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center gap-2 py-8 text-center border border-dashed rounded-xl mb-5">
                  <MessageSquarePlus className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Be the first to comment.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Share your thoughts on this issue.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-5">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 group">
                      <img
                        src={c.author.avatarUrl}
                        alt={c.author.name}
                        className="h-8 w-8 rounded-full object-cover border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">
                              {c.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          {/* Delete button — admin or own comment */}
                          {canDeleteComment(c) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              disabled={deleteCommentMutation.isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    "Delete this comment? This can't be undone."
                                  )
                                ) {
                                  deleteCommentMutation.mutate(c.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {/* "text" field maps from backend "content" via service mapper */}
                        <p className="text-sm text-foreground mt-1 leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New comment textarea */}
              <div className="pt-4 border-t space-y-2">
                <Textarea
                  id="comment-box"
                  placeholder="Add a comment... (max 500 characters)"
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={500}
                  disabled={commentMutation.isPending}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {commentText.length}/500
                  </span>
                  <Button
                    size="sm"
                    disabled={
                      commentMutation.isPending || !commentText.trim()
                    }
                    onClick={handlePostComment}
                  >
                    {commentMutation.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Posting...
                      </>
                    ) : (
                      "Post comment"
                    )}
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4">
            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-bold">Location</h3>
              <div className="mt-3">
                <MapView
                  center={issue.location}
                  markers={[{ position: issue.location, title: issue.title }]}
                  height={220}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {issue.address}
              </p>
            </div>

            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-bold">Reporter</h3>
              {issue.reporter && !issue.anonymous ? (
                <div className="flex items-center gap-3 mt-3">
                  {issue.reporter.avatarUrl && (
                    <img
                      src={issue.reporter.avatarUrl}
                      className="h-10 w-10 rounded-full"
                      alt=""
                    />
                  )}
                  <div>
                    <div className="font-semibold text-sm">
                      {issue.reporter.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Citizen Reporter
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground inline-flex items-center gap-2">
                  <EyeOff className="h-4 w-4" /> Reported anonymously
                </div>
              )}
            </div>

            {/* Admin info panel */}
            {isAdmin && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                <h3 className="font-bold text-amber-900 dark:text-amber-200">
                  Admin Actions
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 mb-3">
                  Manage this report from the admin panel.
                </p>
                <Link
                  to="/admin"
                  search={{ tab: "reports" } as any}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                >
                  Go to Reports Management →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
