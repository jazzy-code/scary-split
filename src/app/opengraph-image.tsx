import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { SITE_NAME, THEME_COLOR } from "@/lib/site"

export const alt = "Scary Split: divide gastos entre amigos"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/scary-split-logo.png"), "base64")

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${THEME_COLOR}, #4a2a8f 55%, #8b5cf6)`,
          color: "white"
        }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${logo}`} alt="" width={260} height={260} />
        <div style={{ display: "flex", marginTop: 16, fontSize: 96 }}>{SITE_NAME}</div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 40, color: "#fcd34d" }}>
          Divide gastos entre amigos sin sustos
        </div>
      </div>
    ),
    size
  )
}
