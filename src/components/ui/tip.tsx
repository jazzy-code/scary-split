import type { ReactElement } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type TipProps = {
  label: string
  /** Elemento que dispara el tooltip, normalmente un botón de solo icono */
  children: ReactElement
}

export function Tip({ label, children }: TipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />

      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
