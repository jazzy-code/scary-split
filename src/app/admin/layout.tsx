import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "Scary Split · Admin" },
  robots: { index: false, follow: false }
}

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex flex-1 flex-col bg-muted/30">{children}</div>
}
