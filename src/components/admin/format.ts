// Zona fija para que servidor y navegador muestren exactamente lo mismo
const TIME_ZONE = "America/Mexico_City"

const dateTime = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: TIME_ZONE })
const dateOnly = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: TIME_ZONE })

export function formatDateTime(value: string | null) {
  return value ? dateTime.format(new Date(value)) : "Nunca"
}

export function formatDate(value: string) {
  return dateOnly.format(new Date(value))
}
