import { calculateBalances } from "./calculate-balances"
import { simplifyDebts } from "./simplify-debts"
import { splitCustom } from "./split-custom"
import { splitEqually } from "./split-equally"
import type { Expense, Person } from "./types"

const people: Person[] = [
  { id: "javier", name: "Javier" },
  { id: "carlos", name: "Carlos" },
  { id: "luis", name: "Luis" },
  { id: "ana", name: "Ana" },
  { id: "pedro", name: "Pedro" },
]

const expenses: Expense[] = [
  {
    id: "hotel",
    description: "Hotel",
    amount: 8000,
    paidBy: "javier",
    participants: people.map((person) => ({
      personId: person.id,
      amount: 1600,
    })),
  },
  {
    id: "cena",
    description: "Cena",
    amount: 3000,
    paidBy: "carlos",
    participants: people.map((person) => ({
      personId: person.id,
      amount: 600,
    })),
  },
  {
    id: "gasolina",
    description: "Gasolina",
    amount: 2000,
    paidBy: "luis",
    participants: people.map((person) => ({
      personId: person.id,
      amount: 400,
    })),
  },
]

const balances = calculateBalances(people, expenses)

console.log("BALANCES")
console.table(balances)

const settlements = simplifyDebts(balances)

console.log("SETTLEMENTS")
console.table(settlements)

console.log("SPLIT $1,000 BETWEEN 3")

const split = splitEqually(1000, [
  "javier",
  "carlos",
  "luis",
])

console.table(split)

console.log(
  "TOTAL:",
  split.reduce((sum, item) => sum + item.amount, 0),
)

const split2 = splitEqually(1000.50, [
  "javier",
  "carlos",
  "luis",
])

console.log("SPLIT $1,000.50 BETWEEN 3")
console.table(split2)

console.log(
  "TOTAL:",
  split2.reduce((sum, item) => sum + item.amount, 0),
)

const split3 = splitEqually(2847.30, [
  "javier",
  "carlos",
  "luis",
  "ana",
  "pedro",
])

console.log("SPLIT $2,847.30 BETWEEN 5")
console.table(split3)

console.log(
  "TOTAL:",
  split3.reduce((sum, item) => sum + item.amount, 0),
)

console.log("\nSPLIT CUSTOM")

const customSplit = splitCustom(3000, [
  {
    personId: "javier",
    amount: 800,
  },
  {
    personId: "carlos",
    amount: 1200,
  },
  {
    personId: "luis",
    amount: 500,
  },
  {
    personId: "ana",
    amount: 500,
  },
])

console.table(customSplit)

console.log(
  "TOTAL:",
  customSplit.reduce(
    (sum, participant) => sum + participant.amount,
    0,
  ),
)

console.log("\nINVALID CUSTOM SPLIT")

try {
  splitCustom(3000, [
    {
      personId: "javier",
      amount: 1000,
    },
    {
      personId: "carlos",
      amount: 1000,
    },
  ])
} catch (error) {
  console.error(
    error instanceof Error ? error.message : error,
  )
}