import { getTripsAction } from "@/features/trips/actions"

import HomePageClient from "./home-page-client"

export default async function HomePage() {
  const trips = await getTripsAction()

  return <HomePageClient trips={trips} />
}
