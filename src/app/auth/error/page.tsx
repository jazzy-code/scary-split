import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "No pudimos iniciar sesión | Scary Split"
}

type AuthErrorPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

const errorMessages: Record<string, { title: string; description: string }> = {
  account_not_linked: {
    title: "Ese correo ya tiene una cuenta",
    description:
      "Ya existe una cuenta registrada con este correo y contraseña. Inicia sesión con tu correo y contraseña y, desde tu perfil, vincula tu cuenta de Google para poder usar ambos métodos."
  },
  access_denied: {
    title: "Cancelaste el acceso",
    description: "No se completó el inicio de sesión con Google. Puedes intentarlo de nuevo cuando quieras."
  }
}

const fallbackMessage = {
  title: "No pudimos iniciar sesión",
  description: "Ocurrió un problema al iniciar sesión. Inténtalo de nuevo en un momento."
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = await searchParams

  const message = (error && errorMessages[error]) || fallbackMessage

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Image src="/scary-split-logo.png" alt="" width={96} height={96} />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{message.title}</h1>
        <p className="max-w-md text-muted-foreground">{message.description}</p>
      </div>

      <Button nativeButton={false} render={<Link href="/" />}>
        Volver al inicio
      </Button>
    </main>
  )
}
