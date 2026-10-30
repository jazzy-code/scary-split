import nodemailer, { type Transporter } from "nodemailer"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const from = process.env.EMAIL_FROM ?? "Scary Split <hello@jazzycode.com>"

const smtpPort = Number(process.env.SMTP_PORT ?? 465)

// SMTP de respaldo (Hostinger): se usa solo cuando Resend falla o agota su cuota
const smtp =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      })
    : null

// Cuando Resend informa que la cuota se agotó, no tiene caso volver a intentarlo hasta que se reinicie
let resendBlockedUntil = 0

type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
}

function getQuotaResetTime(errorName: string) {
  const now = new Date()

  if (errorName === "daily_quota_exceeded") {
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  }

  if (errorName === "monthly_quota_exceeded") {
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  }

  return 0
}

async function sendWithResend(client: Resend, { to, subject, html, text }: SendEmailInput) {
  try {
    const { error } = await client.emails.send({ from, to, subject, html, text })

    if (!error) {
      return true
    }

    console.error(`[email] Resend falló (${error.name}): ${error.message}`)

    resendBlockedUntil = getQuotaResetTime(error.name)
  } catch (error) {
    console.error("[email] No se pudo contactar a Resend", error)
  }

  return false
}

async function sendWithSmtp(transport: Transporter, { to, subject, html, text }: SendEmailInput) {
  try {
    await transport.sendMail({ from: process.env.SMTP_FROM ?? from, to, subject, html, text })

    return true
  } catch (error) {
    console.error("[email] El SMTP de respaldo también falló", error)

    return false
  }
}

export async function sendEmail(input: SendEmailInput) {
  if (!resend && !smtp) {
    // Sin ningún proveedor (desarrollo local) se imprime el correo para poder probar los enlaces
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[email] Sin proveedor configurado. Correo para ${input.to}: ${input.subject}\n${input.text}`)
    } else {
      console.error("[email] No hay proveedor de correo configurado; no se envió el correo")
    }

    return
  }

  // No se lanzan errores: un fallo de correo no debe romper el registro ni el flujo de contraseña
  if (resend && Date.now() >= resendBlockedUntil && (await sendWithResend(resend, input))) {
    return
  }

  if (!smtp) {
    return
  }

  console.warn("[email] Enviando con el SMTP de respaldo")

  await sendWithSmtp(smtp, input)
}
