import type { Balance, Settlement } from "./types"

export function simplifyDebts(
  balances: Balance[],
): Settlement[] {
  const creditors = balances
    .filter((balance) => balance.amount > 0.009)
    .map((balance) => ({
      ...balance,
      amount: roundMoney(balance.amount),
    }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = balances
    .filter((balance) => balance.amount < -0.009)
    .map((balance) => ({
      ...balance,
      amount: roundMoney(Math.abs(balance.amount)),
    }))
    .sort((a, b) => b.amount - a.amount)

  const settlements: Settlement[] = []

  let creditorIndex = 0
  let debtorIndex = 0

  while (
    creditorIndex < creditors.length &&
    debtorIndex < debtors.length
  ) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]

    const amount = roundMoney(
      Math.min(creditor.amount, debtor.amount),
    )

    settlements.push({
      from: debtor.personId,
      to: creditor.personId,
      amount,
    })

    creditor.amount = roundMoney(
      creditor.amount - amount,
    )

    debtor.amount = roundMoney(
      debtor.amount - amount,
    )

    if (creditor.amount < 0.01) {
      creditorIndex++
    }

    if (debtor.amount < 0.01) {
      debtorIndex++
    }
  }

  return settlements
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}