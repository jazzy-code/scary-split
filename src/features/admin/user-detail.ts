"use server"

import { getPendingSettlements, isTripSettled } from "@/lib/expenses/is-trip-settled"
import type { Trip } from "@/lib/expenses/types"
import { requireAdmin } from "@/lib/admin/session"
import { roundMoney } from "@/lib/money/round"
import { prisma } from "@/lib/prisma/client"
import type { AdminTripDetail, AdminUserDetailResult } from "./user-detail-types"

// Solo lectura: esta acción únicamente consulta. Los errores se devuelven como valor porque en producción
// Next oculta el mensaje de los que se lanzan.
export async function getAdminUserDetailAction(userId: string): Promise<AdminUserDetailResult> {
  await requireAdmin()

  try {
    const memberships = await prisma.tripMember.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        trip: {
          include: {
            members: { include: { user: { select: { name: true } } } },
            people: { orderBy: { createdAt: "asc" } },
            expenses: { orderBy: { createdAt: "desc" }, include: { participants: true } },
            payments: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } }
          }
        }
      }
    })

    const trips = memberships.map((membership): AdminTripDetail => {
      const { trip } = membership
      const roleByUser = new Map(trip.members.map((member) => [member.userId, member.role]))
      const nameById = new Map(trip.people.map((person) => [person.id, person.name]))
      const name = (personId: string) => nameById.get(personId) ?? "Persona eliminada"

      // Mismo formato que usa la app para decidir si un sustito está saldado y qué falta por pagar
      const domainTrip: Trip = {
        id: trip.id,
        name: trip.name,
        viewer: { role: membership.role, personId: null },
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        people: trip.people.map((person) => ({ id: person.id, name: person.name })),
        expenses: trip.expenses.map((expense) => ({
          id: expense.id,
          description: expense.description,
          amount: expense.amount.toNumber(),
          paidBy: expense.paidById,
          splitType: expense.splitType === "EQUAL" ? "equal" : "custom",
          participants: expense.participants.map((participant) => ({
            personId: participant.personId,
            amount: participant.amount.toNumber()
          }))
        })),
        payments: trip.payments.map((payment) => ({
          id: payment.id,
          from: payment.fromPersonId,
          to: payment.toPersonId,
          amount: payment.amount.toNumber(),
          createdAt: payment.createdAt
        }))
      }

      return {
        id: trip.id,
        name: trip.name,
        role: membership.role,
        ownerName: trip.members.find((member) => member.role === "OWNER")?.user.name ?? null,
        createdAt: trip.createdAt.toISOString(),
        joinedAt: membership.createdAt.toISOString(),
        settled: isTripSettled(domainTrip),
        expensesTotal: roundMoney(domainTrip.expenses.reduce((sum, expense) => sum + expense.amount, 0)),
        paymentsTotal: roundMoney(domainTrip.payments.reduce((sum, payment) => sum + payment.amount, 0)),
        people: trip.people.map((person) => ({
          id: person.id,
          name: person.name,
          linked: !!person.userId,
          role: person.userId ? (roleByUser.get(person.userId) ?? null) : null,
          isThisUser: person.userId === userId
        })),
        expenses: trip.expenses.map((expense) => ({
          id: expense.id,
          description: expense.description,
          amount: expense.amount.toNumber(),
          paidByName: name(expense.paidById),
          splitType: expense.splitType === "EQUAL" ? "equal" : "custom",
          participantCount: expense.participants.length,
          createdAt: expense.createdAt.toISOString()
        })),
        payments: trip.payments.map((payment) => ({
          id: payment.id,
          fromName: name(payment.fromPersonId),
          toName: name(payment.toPersonId),
          amount: payment.amount.toNumber(),
          createdByName: payment.createdBy?.name ?? null,
          createdAt: payment.createdAt.toISOString()
        })),
        pending: getPendingSettlements(domainTrip).map((settlement) => ({
          fromName: name(settlement.from),
          toName: name(settlement.to),
          amount: settlement.amount
        }))
      }
    })

    return {
      ok: true,
      detail: {
        created: trips.filter((trip) => trip.role === "OWNER"),
        invited: trips.filter((trip) => trip.role === "MEMBER")
      }
    }
  } catch {
    return { ok: false, message: "No se pudo cargar la información de este usuario" }
  }
}
