import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getTripAction } from "@/features/trips/actions"

import TripPageClient from "./trip-page-client"

// Sin datos del sustito: el título y la vista previa no deben revelar nada privado
export const metadata: Metadata = {
  title: "Sustito",
  description: "Consulta los gastos y cuánto le toca a cada quien en este sustito.",
  robots: { index: false, follow: false }
}

type TripPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    share?: string
  }>
}

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const { id } = await params
  const { share } = await searchParams

  const trip = await getTripAction(id, share)

  if (!trip) {
    notFound()
  }

  return <TripPageClient trip={trip} shareToken={share} />
}
