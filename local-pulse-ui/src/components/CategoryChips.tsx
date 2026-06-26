import { cn } from "@/lib/utils";

interface Chip { value: string; label: string; emoji?: string; }

interface Props {
  chips: Chip[];
  value: string | null;
  onChange: (v: string | null) => void;
  className?: string;
}

export function CategoryChips({ chips, value, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        onClick={() => onChange(null)}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
          value === null ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted",
        )}
      >
        All
      </button>
      {chips.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-1.5",
            value === c.value ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted",
          )}
        >
          {c.emoji && <span>{c.emoji}</span>} {c.label}
        </button>
      ))}
    </div>
  );
}
