import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Restablecer contraseña | Scary Split"
}

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string
    error?: string
  }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token, error } = await searchParams

  const isInvalid = !token || !!error

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Image src="/scary-split-logo.png" alt="" width={96} height={96} />

      {isInvalid ? (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Enlace no válido</h1>
            <p className="max-w-md text-muted-foreground">
              El enlace para restablecer la contraseña no es válido o ya expiró. Solicita uno nuevo desde &ldquo;¿Olvidaste
              tu contraseña?&rdquo; al iniciar sesión.
            </p>
          </div>

          <Button nativeButton={false} render={<Link href="/" />}>
            Volver al inicio
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Elige una nueva contraseña</h1>
            <p className="max-w-md text-muted-foreground">Escríbela dos veces para confirmarla.</p>
          </div>

          <ResetPasswordForm token={token} />
        </>
      )}
    </main>
  )
}
