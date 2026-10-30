"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" color="green" />
        ),
        info: (
          <InfoIcon className="size-4" color="dodgerblue" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" color="orange" />
        ),
        error: (
          <OctagonXIcon className="size-4" color="red" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          title: "!font-semibold !text-foreground",
          description: "!text-foreground/75",
          success:
            "!border-green-500/40 !shadow-[inset_0_0_16px_rgba(34,197,94,0.22),0_4px_12px_rgba(0,0,0,0.1)]",
          error:
            "!border-red-500/40 !shadow-[inset_0_0_16px_rgba(239,68,68,0.22),0_4px_12px_rgba(0,0,0,0.1)]",
          warning:
            "!border-yellow-500/40 !shadow-[inset_0_0_16px_rgba(234,179,8,0.25),0_4px_12px_rgba(0,0,0,0.1)]",
          info:
            "!border-blue-500/40 !shadow-[inset_0_0_16px_rgba(59,130,246,0.22),0_4px_12px_rgba(0,0,0,0.1)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
