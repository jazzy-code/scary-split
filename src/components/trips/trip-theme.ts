// Cada nivel de gasto tiene su propio gradiente: mientras más se gasta, más "tenebroso"
const tripThemes = [
  { maxTotal: 2500, background: "from-[#052e2b] via-[#0f766e] to-[#a3e635]", drip: "#d9f99d" },
  { maxTotal: 5000, background: "from-[#1e1b4b] via-[#3730a3] to-[#38bdf8]", drip: "#bae6fd" },
  { maxTotal: 7500, background: "from-[#24124d] via-[#4a2a8f] to-[#8b5cf6]", drip: "#c4b5fd" },
  { maxTotal: 10000, background: "from-[#3b0764] via-[#a21caf] to-[#fb923c]", drip: "#fdba74" },
  { maxTotal: Infinity, background: "from-[#450a0a] via-[#b91c1c] to-[#f472b6]", drip: "#fecdd3" }
]

const avatarColors = ["bg-violet-500", "bg-fuchsia-500", "bg-orange-500", "bg-teal-500", "bg-sky-500", "bg-rose-500"]

function hashId(id: string) {
  return [...id].reduce((total, char) => total + char.charCodeAt(0), 0)
}

export function getTripTheme(totalSpent: number) {
  return tripThemes.find((theme) => totalSpent < theme.maxTotal) ?? tripThemes[tripThemes.length - 1]
}

export function getAvatarColor(id: string) {
  return avatarColors[hashId(id) % avatarColors.length]
}
