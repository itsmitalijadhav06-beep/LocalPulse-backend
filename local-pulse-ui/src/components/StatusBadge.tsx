import { cn } from "@/lib/utils";
import type { IssueStatus } from "@/types";
import { STATUS_LABEL } from "@/constants";

const styles: Record<IssueStatus, string> = {
  open: "bg-[color:var(--status-open)]/10 text-[color:var(--status-open)] border-[color:var(--status-open)]/20",
  under_review: "bg-[color:var(--status-review)]/15 text-[color:var(--status-review)] border-[color:var(--status-review)]/20",
  in_progress: "bg-[color:var(--status-progress)]/10 text-[color:var(--status-progress)] border-[color:var(--status-progress)]/20",
  resolved: "bg-[color:var(--status-resolved)]/10 text-[color:var(--status-resolved)] border-[color:var(--status-resolved)]/20",
};

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
