import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getLocaleByCurrency = (currency: string) => {
  switch (currency) {
    case "EUR":
      return "es-ES" // 1.234,56
    case "USD":
      return "en-US" // 1,234.56
    case "MXN":
    default:
      return "es-MX"
  }
}

export const parseToNumber = (value: string | number, currency: string = ""): number => {
  if (typeof value === "number") return value
  if (!value || typeof value !== "string") return 0

  // 1. Limpieza básica de símbolos de moneda y espacios
  let cleaned = value.replace(/[^\d,.-]/g, "").trim()

  // 2. DETECCIÓN INTELIGENTE:
  // Si tiene coma Y punto (ej: 1.234,56 o 1,234.56)
  if (cleaned.includes(",") && cleaned.includes(".")) {
    const lastComma = cleaned.lastIndexOf(",")
    const lastDot = cleaned.lastIndexOf(".")

    if (lastComma > lastDot) {
      // Formato Europeo: 1.234,56 -> Quitar puntos, cambiar coma por punto
      cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    } else {
      // Formato Americano: 1,234.56 -> Quitar comas
      cleaned = cleaned.replace(/,/g, "")
    }
  }
  // 3. Si solo tiene COMA y esa coma está cerca del final (posible decimal europeo: 800,00)
  else if (cleaned.includes(",") && !cleaned.includes(".")) {
    const parts = cleaned.split(",")
    if (parts[parts.length - 1].length <= 2) {
      cleaned = cleaned.replace(",", ".")
    } else {
      cleaned = cleaned.replace(",", "") // Era separador de miles
    }
  }
  // 4. Si solo tiene PUNTO y estamos en modo EUR (ej: 800.000)
  else if (cleaned.includes(".") && !cleaned.includes(",") && currency === "EUR") {
    // Aquí hay ambigüedad, pero si hay 3 dígitos después, suele ser miles
    const parts = cleaned.split(".")
    if (parts[parts.length - 1].length !== 3) {
      // Es decimal, lo dejamos como está para parseFloat
    } else {
      cleaned = cleaned.replace(/\./g, "") // Eran miles
    }
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}


export const formatNumber = (value: string | number) => {
  const numeric = typeof value === "string" ? parseToNumber(value) : value
  if (isNaN(numeric)) return "0"
  return numeric.toLocaleString("es-MX", { useGrouping: true, maximumFractionDigits: 2 })
}
