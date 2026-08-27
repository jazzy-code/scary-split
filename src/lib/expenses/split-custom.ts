import { roundMoney } from "@/lib/money/round"
import type { ExpenseParticipant } from "./types"
import { formatNumber } from "../utils"

export function splitCustom(
  amount: number,
  participants: ExpenseParticipant[],
): ExpenseParticipant[] {
  if (participants.length === 0) {
    throw new Error("Debe existir al menos un participante")
  }

  const total = roundMoney(amount)

  if (total <= 0) {
    throw new Error("El gasto debe ser mayor a 0")
  }

  const personIds = new Set<string>()

  for (const participant of participants) {
    if (personIds.has(participant.personId)) {
      throw new Error(
        `El participante "${participant.personId}" está duplicado`,
      )
    }

    personIds.add(participant.personId)

    if (participant.amount < 0) {
      throw new Error(
        `La cantidad de "${participant.personId}" no puede ser negativa`,
      )
    }

    if (
      roundMoney(participant.amount) !== participant.amount
    ) {
      throw new Error(
        `La cantidad de "${participant.personId}" no puede tener más de 2 decimales`,
      )
    }
  }

  const participantsTotal = roundMoney(
    participants.reduce(
      (sum, participant) => sum + participant.amount,
      0,
    ),
  )

  if (participantsTotal !== total) {
    throw new Error(
      `Las cantidades de los participantes ($${formatNumber(participantsTotal)}}) no coinciden con el total del gasto ($${formatNumber(total)})`,
    )
  }

  return participants.map((participant) => ({
    ...participant,
    amount: roundMoney(participant.amount),
  }))
}
