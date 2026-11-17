import { redirect } from "next/navigation"

import { getAdminSession } from "@/lib/admin/session"
import { AdminLoginForm } from "./admin-login-form"

export default async function AdminLoginPage() {
  if (await getAdminSession()) {
    redirect("/admin")
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <AdminLoginForm />
    </main>
  )
}
