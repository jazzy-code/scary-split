import Image from "next/image"
import { Receipt, SplitSquareHorizontal, UsersRound, type LucideIcon } from "lucide-react"

import { Drip } from "@/components/trips/drip"

const steps: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: UsersRound, title: "Crea tu sustito", description: "Ponle nombre y agrega a tus amigos." },
  { icon: Receipt, title: "Anota los gastos", description: "Quién pagó y cómo se divide: parejo o por consumo." },
  { icon: SplitSquareHorizontal, title: "Saldamos cuentas", description: "Te decimos quién le transfiere a quién." }
]

export function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#24124d] via-[#4a2a8f] to-[#8b5cf6] p-6 text-white shadow-lg ring-1 ring-black/10 md:p-10">
      <Drip color="#c4b5fd" className="h-24 w-44 md:h-28 md:w-52" />

      <Image
        src="/scary-split-logo.png"
        alt=""
        width={260}
        height={260}
        className="pointer-events-none absolute -right-6 -bottom-8 hidden size-56 rotate-6 opacity-30 md:block"
      />

      <div className="relative max-w-2xl">
        <div className="flex items-center gap-3">
          <Image src="/scary-split-logo.png" alt="Logo" width={64} height={64} priority />

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Scary Split</h1>
        </div>

        <h2 className="mt-5 text-xl font-semibold text-amber-300 md:text-2xl">
          ¿Eres el del &ldquo;yo pago y luego me transfieren&rdquo;?
        </h2>

        <p className="mt-2 text-base text-white/85 md:text-lg">
          Que el lunes no te asuste el sustito de gastos. Anota lo que se gastó en tu viaje, fiesta o salida y deja que
          Scary Split calcule cuánto le toca a cada quien, así es más fácil saber qué se pago y cuánto se debe.
        </p>
      </div>

      <ol className="relative mt-6 grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-300 text-[#24124d]">
              <step.icon className="size-5" />
            </span>

            <div>
              <p className="text-sm font-semibold">
                {index + 1}. {step.title}
              </p>
              <p className="text-xs text-white/75">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="relative mt-5 text-sm text-white/80">
        Simplificamos las deudas para que no hagan mil transferencias. Así el sustito del fin de semana ya no da tanto
        miedo.
      </p>
    </section>
  )
}
