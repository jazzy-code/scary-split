import Link from "next/link"
import { SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <SearchX className="size-12 text-muted-foreground" />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">No encontramos lo que buscas</h1>
        <p className="max-w-md text-muted-foreground">
          Es posible que el sustito no exista o que no tengas autorización para verlo.
        </p>
      </div>

      <Button nativeButton={false} render={<Link href="/" />}>
        Volver al inicio
      </Button>
    </main>
  )
}
