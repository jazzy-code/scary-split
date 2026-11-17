"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShieldCheck, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const items = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true, superOnly: false },
  { href: "/admin/users", label: "Usuarios", icon: Users, exact: false, superOnly: false },
  { href: "/admin/admins", label: "Administradores", icon: ShieldCheck, exact: false, superOnly: true }
]

export function AdminNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items
        .filter((item) => isSuperAdmin || !item.superOnly)
        .map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-violet-100 text-violet-800" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
    </nav>
  )
}
