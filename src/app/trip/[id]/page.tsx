import { getTripAction } from "@/features/trips/actions"

import TripPageClient from "./trip-page-client"

type TripPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params
  const trip = await getTripAction(id)

  return <TripPageClient trip={trip} />
}
