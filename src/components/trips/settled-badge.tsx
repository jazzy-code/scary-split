import { cn } from "@/lib/utils"

export function SettledBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-sm font-bold text-emerald-950 shadow-sm",
        className
      )}
    >
      👻 Saldado
    </span>
  )
}
