import { cn } from "@/lib/utils"

type DripProps = {
  color: string
  className?: string
}

export function Drip({ color, className }: DripProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 70"
      className={cn(
        "animate-drip pointer-events-none absolute top-0 right-0 h-20 w-36 origin-top motion-reduce:animate-none",
        className
      )}>
      <path
        fill={color}
        fillOpacity={0.9}
        d="M0 0H120V24C120 34 110 34 110 24C110 20 104 20 104 26V54C104 64 92 64 92 54V30C92 24 84 24 84 30C84 38 74 38 74 30C74 22 60 22 60 28V40C60 48 50 48 50 40V24C50 18 36 18 36 24C36 30 26 30 26 24V0Z"
      />
      <circle cx="98" cy="52" r="2.5" fill="white" fillOpacity={0.55} />
      <circle cx="55" cy="38" r="2" fill="white" fillOpacity={0.55} />
    </svg>
  )
}
