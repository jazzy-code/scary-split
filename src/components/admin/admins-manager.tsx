"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Wand2 } from "lucide-react"
import { toast } from "sonner"

import { DeleteAlertDialog } from "@/components/alert-dialogs/delete-alert-dialog"
import { formatDate, formatDateTime } from "@/components/admin/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createAdminAction, setAdminActiveAction } from "@/features/admin/admins-actions"
import { ADMIN_PASSWORD_MIN_LENGTH, type AdminListItem } from "@/features/admin/admins-types"

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*"

function generatePassword(length = 16) {
  const values = crypto.getRandomValues(new Uint32Array(length))

  return Array.from(values, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join("")
}

export function AdminsManager({ admins, currentAdminId }: { admins: AdminListItem[]; currentAdminId: string }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<AdminListItem | null>(null)

  async function confirmToggle() {
    if (!toggleTarget) {
      return
    }

    const target = toggleTarget
    const result = await setAdminActiveAction({ id: target.id, active: !target.active })

    setToggleTarget(null)

    if (!result.ok) {
      toast.error("No se pudo actualizar", { description: result.message })
      return
    }

    toast.success(target.active ? "Administrador desactivado" : "Administrador activado")
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Nuevo administrador
        </Button>
      </div>

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última sesión</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {admins.map((admin) => {
              const isSelf = admin.id === currentAdminId
              const canToggle = !isSelf && admin.role !== "SUPER_ADMIN"

              return (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.name}
                    {isSelf && <span className="ml-2 text-xs font-normal text-violet-600">(tú)</span>}
                  </TableCell>

                  <TableCell>{admin.email}</TableCell>

                  <TableCell>
                    <Badge variant={admin.role === "SUPER_ADMIN" ? "default" : "outline"}>
                      {admin.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {admin.active ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>

                  <TableCell>{formatDateTime(admin.lastLoginAt)}</TableCell>
                  <TableCell>{formatDate(admin.createdAt)}</TableCell>

                  <TableCell className="text-right">
                    {canToggle && (
                      <Button variant="outline" size="sm" onClick={() => setToggleTarget(admin)}>
                        {admin.active ? "Desactivar" : "Activar"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <CreateAdminDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false)
          router.refresh()
        }}
      />

      <DeleteAlertDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={confirmToggle}
        title={toggleTarget?.active ? "¿Desactivar administrador?" : "¿Activar administrador?"}
        confirmLabel={toggleTarget?.active ? "Desactivar" : "Activar"}
        description={
          toggleTarget?.active
            ? `${toggleTarget.name} perderá el acceso al panel y se cerrarán sus sesiones abiertas.`
            : `${toggleTarget?.name} podrá volver a entrar al panel.`
        }
      />
    </div>
  )
}

function CreateAdminDialog({
  open,
  onClose,
  onCreated
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {/* Se remonta al abrir para empezar con el formulario vacío */}
        {open && <CreateAdminForm onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  )
}

function CreateAdminForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setPending(true)
    setError("")

    try {
      const result = await createAdminAction({ name, email, password })

      if (!result.ok) {
        setError(result.message)
        return
      }

      toast.success("Administrador creado", { description: `${email.trim()} ya puede entrar al panel.` })
      onCreated()
    } catch {
      setError("No se pudo crear el administrador")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Nuevo administrador</DialogTitle>

        <DialogDescription>
          Tendrá acceso de solo lectura a los usuarios. Compárteles la contraseña por un canal seguro; después puede
          cambiarla desde su cuenta.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="new-admin-name">Nombre</Label>
        <Input id="new-admin-name" value={name} disabled={pending} onChange={(event) => setName(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-admin-email">Correo electrónico</Label>
        <Input
          id="new-admin-email"
          type="email"
          autoComplete="off"
          value={email}
          disabled={pending}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="new-admin-password">Contraseña temporal</Label>

          <button
            type="button"
            disabled={pending}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            onClick={() => setPassword(generatePassword())}
          >
            <Wand2 className="size-3" />
            Generar
          </button>
        </div>

        <PasswordInput
          id="new-admin-password"
          autoComplete="new-password"
          value={password}
          disabled={pending}
          onChange={(event) => setPassword(event.target.value)}
        />

        <p className="text-xs text-muted-foreground">Mínimo {ADMIN_PASSWORD_MIN_LENGTH} caracteres.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Crear administrador
      </Button>
    </form>
  )
}
