import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function FloatingActionButton() {
  return (
    <Link
      to="/report"
      className="hidden lg:flex fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
      aria-label="Report Issue"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
