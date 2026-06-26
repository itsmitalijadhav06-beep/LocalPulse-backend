import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-muted grid place-items-center">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>}
      {actionLabel && (
        <Button onClick={onAction} className="mt-5">{actionLabel}</Button>
      )}
    </div>
  );
}
