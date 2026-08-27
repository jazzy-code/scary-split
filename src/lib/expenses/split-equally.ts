import { roundMoney } from "@/lib/money/round"

export function splitEqually(
  amount: number,
  personIds: string[],
): { personId: string; amount: number }[] {
  if (personIds.length === 0) {
    return []
  }

  const total = roundMoney(amount)
  const baseAmount = roundMoney(total / personIds.length)

  const result = personIds.map((personId) => ({
    personId,
    amount: baseAmount,
  }))

  const currentTotal = roundMoney(
    result.reduce((sum, participant) => sum + participant.amount, 0),
  )

  const difference = roundMoney(total - currentTotal)

  if (difference !== 0) {
    result[0].amount = roundMoney(
      result[0].amount + difference,
    )
  }

  return result
}