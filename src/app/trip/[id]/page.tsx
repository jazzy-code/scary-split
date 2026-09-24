import { getTripAction } from "@/features/trips/actions"

import TripPageClient from "./trip-page-client"

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

  return <TripPageClient trip={trip} shareToken={share} />
}
