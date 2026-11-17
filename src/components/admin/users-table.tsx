"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react"
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"

import { formatDateTime } from "@/components/admin/format"
import { UserDetailDialog } from "@/components/admin/user-detail-dialog"
import { UserAvatar } from "@/components/profile/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PAGE_SIZES, type AdminUserRow, type UsersPage, type UsersQuery } from "@/features/admin/users-query"
import { cn } from "@/lib/utils"

const providerLabels: Record<string, string> = { credential: "Correo y contraseña", google: "Google" }

const providerItems = [
  { value: "all", label: "Todas las formas de registro" },
  { value: "credential", label: "Correo y contraseña" },
  { value: "google", label: "Google" }
]

const pageSizeItems = PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))

const column = createColumnHelper<AdminUserRow>()

type SortKey = UsersQuery["sort"]

function CountBadge({ count, label, className }: { count: number; label: string; className: string }) {
  return (
    <Badge variant="secondary" className={cn(count === 0 ? "text-muted-foreground" : className)}>
      {count} {label}
    </Badge>
  )
}

export function UsersTable({ data }: { data: UsersPage }) {
  const { query, rows, total, pageCount } = data
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState(query.q ?? "")
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  function navigate(changes: Partial<UsersQuery>, resetPage = true) {
    const next = { ...query, ...changes, ...(resetPage && { page: 1 }) }
    const params = new URLSearchParams()

    // Solo viajan en la URL los valores que no son los de por defecto
    if (next.q) params.set("q", next.q)
    if (next.provider !== "all") params.set("provider", next.provider)
    if (next.from) params.set("from", next.from)
    if (next.to) params.set("to", next.to)
    if (next.sort !== "createdAt" || next.dir !== "desc") {
      params.set("sort", next.sort)
      params.set("dir", next.dir)
    }
    if (next.page > 1) params.set("page", String(next.page))
    if (next.pageSize !== 10) params.set("pageSize", String(next.pageSize))

    const queryString = params.toString()

    startTransition(() => router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false }))
  }

  function toggleSort(key: SortKey) {
    if (query.sort === key) {
      navigate({ dir: query.dir === "asc" ? "desc" : "asc" })
    } else {
      navigate({ sort: key, dir: key === "name" || key === "email" ? "asc" : "desc" })
    }
  }

  function onSearchChange(value: string) {
    setSearch(value)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => navigate({ q: value.trim() || undefined }), 400)
  }

  function sortableHeader(key: SortKey, label: string) {
    const Icon = query.sort !== key ? ArrowUpDown : query.dir === "asc" ? ArrowUp : ArrowDown

    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 rounded outline-none hover:text-foreground focus-visible:text-foreground"
      >
        {label}
        <Icon className={cn("size-3.5", query.sort !== key && "opacity-40")} />
      </button>
    )
  }

  const columns = useMemo(
    () => [
      column.accessor("name", {
        header: () => sortableHeader("name", "Nombre"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <UserAvatar name={row.original.name} image={row.original.image} size="sm" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        )
      }),
      column.accessor("email", {
        header: () => sortableHeader("email", "Correo"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.email}</span>
            {!row.original.emailVerified && (
              <Badge variant="outline" className="text-muted-foreground">
                Sin verificar
              </Badge>
            )}
          </div>
        )
      }),
      column.accessor("providers", {
        header: "Registro",
        cell: ({ getValue }) => (
          <div className="flex gap-1">
            {getValue().map((provider) => (
              <Badge key={provider} variant="outline">
                {providerLabels[provider] ?? provider}
              </Badge>
            ))}
          </div>
        )
      }),
      column.accessor("createdAt", {
        header: () => sortableHeader("createdAt", "Registrado"),
        cell: ({ getValue }) => formatDateTime(getValue())
      }),
      column.accessor("lastLoginAt", {
        header: () => sortableHeader("lastLoginAt", "Última sesión"),
        cell: ({ getValue }) => formatDateTime(getValue())
      }),
      column.display({
        id: "trips",
        header: "Sustitos",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <CountBadge count={row.original.createdTrips} label="creados" className="bg-violet-100 text-violet-700" />
            <CountBadge
              count={row.original.invitedTrips}
              label="como invitado"
              className="bg-emerald-100 text-emerald-700"
            />
          </div>
        )
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.sort, query.dir, query.q, query.provider, query.from, query.to, query.pageSize]
  )

  // TanStack no maneja el estado: orden, filtros y páginas viven en la URL y se resuelven en el servidor
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel(), manualSorting: true, manualPagination: true })

  const hasFilters = !!(query.q || query.provider !== "all" || query.from || query.to)
  const firstItem = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1
  const lastItem = Math.min(query.page * query.pageSize, total)

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            placeholder="Buscar por nombre o correo"
            aria-label="Buscar usuarios"
            className="h-9 pl-8"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <Select
          items={providerItems}
          value={query.provider}
          onValueChange={(value) => navigate({ provider: value as UsersQuery["provider"] })}
        >
          <SelectTrigger aria-label="Forma de registro" className="h-9 w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {providerItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          Desde
          <Input
            type="date"
            className="h-9 w-auto"
            value={query.from ?? ""}
            max={query.to}
            onChange={(event) => navigate({ from: event.target.value || undefined })}
          />
        </label>

        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          Hasta
          <Input
            type="date"
            className="h-9 w-auto"
            value={query.to ?? ""}
            min={query.from}
            onChange={(event) => navigate({ to: event.target.value || undefined })}
          />
        </label>

        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("")
              navigate({ q: undefined, provider: "all", from: undefined, to: undefined })
            }}
          >
            <X />
            Limpiar
          </Button>
        )}

        {pending && <Loader2 className="size-4 animate-spin text-muted-foreground sm:mb-2.5" />}
      </div>

      <div className={cn("rounded-xl border bg-background transition-opacity", pending && "opacity-60")}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No hay usuarios con esos filtros.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver detalle de ${row.original.name}`}
                  className="cursor-pointer outline-none focus-visible:bg-muted/50"
                  onClick={() => setSelectedUser(row.original)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedUser(row.original)
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {firstItem}–{lastItem} de {total} {total === 1 ? "usuario" : "usuarios"}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5">
            Filas
            <Select
              items={pageSizeItems}
              value={String(query.pageSize)}
              onValueChange={(value) => navigate({ pageSize: Number(value) as UsersQuery["pageSize"] })}
            >
              <SelectTrigger aria-label="Filas por página" className="h-9 w-20">
                <SelectValue />
              </SelectTrigger>

              <SelectContent className="min-w-20">
                {pageSizeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <span>
            Página {query.page} de {pageCount}
          </span>

          <Button
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={query.page <= 1}
            onClick={() => navigate({ page: query.page - 1 }, false)}
          >
            <ChevronLeft />
          </Button>

          <Button
            variant="outline"
            size="icon"
            aria-label="Página siguiente"
            disabled={query.page >= pageCount}
            onClick={() => navigate({ page: query.page + 1 }, false)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <UserDetailDialog user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  )
}
