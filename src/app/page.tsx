import type { Metadata } from "next"

import { getTripsAction } from "@/features/trips/actions"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

import HomePageClient from "./home-page-client"

export const metadata: Metadata = {
  alternates: { canonical: "/" }
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  inLanguage: "es"
}

export default async function HomePage() {
  const trips = await getTripsAction()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <HomePageClient trips={trips} />
    </>
  )
}
