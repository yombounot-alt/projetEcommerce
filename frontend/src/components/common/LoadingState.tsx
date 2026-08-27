import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Chargement…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)}>
      <Loader2Icon className="size-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
