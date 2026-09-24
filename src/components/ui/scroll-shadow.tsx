"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type ScrollShadowProps = {
  children: React.ReactNode
  className?: string
  shadowBottomClassName?: string
}

export function ScrollShadow({ children, className, shadowBottomClassName  }: ScrollShadowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showTopShadow, setShowTopShadow] = useState(false)
  const [showBottomShadow, setShowBottomShadow] = useState(false)

  function updateShadows() {
    const element = scrollRef.current

    if (!element) {
      return
    }

    const hasOverflow = element.scrollHeight > element.clientHeight
    const isAtTop = element.scrollTop <= 1
    const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1

    setShowTopShadow(hasOverflow && !isAtTop)
    setShowBottomShadow(hasOverflow && !isAtBottom)
  }

  useEffect(() => {
    const element = scrollRef.current

    if (!element) {
      return
    }

    const frame = requestAnimationFrame(updateShadows)
    const resizeObserver = new ResizeObserver(updateShadows)

    element.addEventListener("scroll", updateShadows)
    resizeObserver.observe(element)

    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener("scroll", updateShadows)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div ref={scrollRef} className="h-full min-h-0 overflow-y-auto">
        {children}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-black/10 to-transparent transition-opacity",
          showTopShadow ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-black/10 to-transparent transition-opacity",
          shadowBottomClassName,
          showBottomShadow ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}
