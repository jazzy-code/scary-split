import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

// Las páginas privadas usan `noindex` en lugar de bloquearse aquí, para que
// los enlaces compartidos sigan generando vista previa.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`
  }
}
