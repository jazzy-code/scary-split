import { ChevronDown } from "lucide-react"

const questions = [
  {
    question: "¿Qué es Scary Split?",
    answer:
      "Es una app web para dividir los gastos de viajes, fiestas y salidas entre amigos. Cada grupo de gastos es un «sustito»."
  },
  {
    question: "¿Cómo se dividen los gastos?",
    answer: "En cada gasto indicas quién pagó y quiénes participan, y lo divides parejo o según el consumo de cada quien."
  },
  {
    question: "¿Cómo sé a quién tengo que transferirle?",
    answer: "Scary Split simplifica las deudas y te dice quién le transfiere a quién, para que no hagan mil transferencias."
  },
  {
    question: "¿Necesito una cuenta?",
    answer: "Sí, para crear un sustito necesitas una cuenta. Puedes registrarte con tu correo o entrar con Google."
  },
  {
    question: "¿Puedo compartir un sustito con mis amigos?",
    answer: "Sí. Desde el sustito puedes copiar un enlace para compartirlo o invitar a cada participante."
  }
]

export function HomeFaq() {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-2xl font-semibold">Preguntas frecuentes sobre dividir gastos</h2>

      <div className="space-y-2">
        {questions.map(({ question, answer }) => (
          <details key={question} className="group rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/10">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <h3 className="font-medium">{question}</h3>
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>

            <p className="mt-2 text-sm text-muted-foreground">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
