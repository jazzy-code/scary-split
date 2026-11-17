import Link from "next/link"
import { ShieldCheck, Users } from "lucide-react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin/session"

export default async function AdminHomePage() {
  const { admin } = await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {admin.name}</h1>
        <p className="text-muted-foreground">Elige un módulo para empezar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/users">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <Users className="size-6 text-violet-600" />
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>Consulta quién usa la app y cómo la está usando.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {admin.role === "SUPER_ADMIN" && (
          <Link href="/admin/admins">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <ShieldCheck className="size-6 text-violet-600" />
                <CardTitle>Administradores</CardTitle>
                <CardDescription>Da de alta a otras personas con acceso al panel.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
