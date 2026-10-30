"use client"

import { useRouter } from "next/navigation"
import { Crown, EllipsisVertical, Mail, Pencil, Trash2, Unlink, UserCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { linkSelfAction, promoteToOwnerAction, unlinkPersonAction } from "@/features/members/actions"
import type { MemberRole, Person } from "@/lib/expenses/types"

type PersonActionsMenuProps = {
  tripId: string
  person: Person
  viewerRole: MemberRole | null
  viewerPersonId: string | null
  onEdit: () => void
  onDelete: () => void
  onInvite: () => void
}

export function PersonActionsMenu({
  tripId,
  person,
  viewerRole,
  viewerPersonId,
  onEdit,
  onDelete,
  onInvite
}: PersonActionsMenuProps) {
  const router = useRouter()

  const isOwner = viewerRole === "OWNER"
  // Solo el dueño puede eliminar a quien tiene una cuenta vinculada
  const canDelete = !person.linked || isOwner

  async function runMemberAction(
    action: () => Promise<{ ok: true } | { ok: false; message: string }>,
    successMessage: string
  ) {
    const result = await action()

    if (!result.ok) {
      toast.error("No se pudo completar la acción", { description: result.message })
      return
    }

    toast.success(successMessage)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <Tip label="Opciones">
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-2 size-10 sm:size-8"
              aria-label={`Opciones de ${person.name}`}
            />
          }
        >
          <EllipsisVertical className="size-4" />
        </DropdownMenuTrigger>
      </Tip>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" />
          Editar
        </DropdownMenuItem>

        {isOwner && !person.linked && (
          <DropdownMenuItem onClick={onInvite}>
            <Mail className="size-4" />
            Invitar
          </DropdownMenuItem>
        )}

        {isOwner && !person.linked && !viewerPersonId && (
          <DropdownMenuItem
            onClick={() => runMemberAction(() => linkSelfAction(tripId, person.id), "Ahora eres este participante")}
          >
            <UserCheck className="size-4" />
            Soy yo
          </DropdownMenuItem>
        )}

        {isOwner && person.linked && person.memberRole === "MEMBER" && (
          <DropdownMenuItem
            onClick={() => runMemberAction(() => promoteToOwnerAction(tripId, person.id), `${person.name} ahora es dueño`)}
          >
            <Crown className="size-4" />
            Hacer dueño
          </DropdownMenuItem>
        )}

        {isOwner && person.linked && (
          <DropdownMenuItem
            onClick={() => runMemberAction(() => unlinkPersonAction(tripId, person.id), `${person.name} se desvinculó`)}
          >
            <Unlink className="size-4" />
            Desvincular
          </DropdownMenuItem>
        )}

        {canDelete && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
