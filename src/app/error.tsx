"use client"

import Link from "next/link"
import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <TriangleAlert className="size-12 text-muted-foreground" />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Algo salió mal</h1>
        <p className="max-w-md text-muted-foreground">Ocurrió un error inesperado. Inténtalo de nuevo en un momento.</p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => retry()}>
          Reintentar
        </Button>
        <Button nativeButton={false} render={<Link href="/" />}>
          Volver al inicio
        </Button>
      </div>
    </main>
  )
}
