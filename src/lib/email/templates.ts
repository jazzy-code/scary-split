// Los correos se abren fuera de la app, así que el logo siempre se toma de la URL pública (también al probar en local)
const EMAIL_ASSETS_URL = process.env.EMAIL_ASSETS_URL ?? "https://scarysplit.jazzycode.com"

type EmailContent = {
  subject: string
  html: string
  text: string
}

type LayoutInput = {
  preheader: string
  title: string
  paragraphs: string[]
  buttonLabel: string
  url: string
  footer: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function renderLayout({ preheader, title, paragraphs, buttonLabel, url, footer }: LayoutInput): EmailContent["html"] {
  const logoUrl = `${EMAIL_ASSETS_URL}/scary-split-logo.png`

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f1fb;font-family:Arial,Helvetica,sans-serif;color:#1f1b2e;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;">
            <tr>
              <td align="center" style="background:#4a2a8f;background-image:linear-gradient(135deg,#24124d,#4a2a8f,#8b5cf6);padding:28px 24px;">
                <img src="${logoUrl}" width="72" height="72" alt="Scary Split" style="display:block;border:0;" />
                <p style="margin:12px 0 0;font-size:20px;font-weight:bold;color:#ffffff;">Scary Split</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;">
                <h1 style="margin:0 0 12px;font-size:22px;color:#24124d;">${escapeHtml(title)}</h1>
                ${paragraphs.map((paragraph) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${paragraph}</p>`).join("\n                ")}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 24px 24px;">
                <a href="${url}" style="display:inline-block;background:#4a2a8f;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 28px;border-radius:12px;">${escapeHtml(buttonLabel)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;">
                <p style="margin:0 0 6px;font-size:12px;color:#6b6780;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p style="margin:0 0 16px;font-size:12px;word-break:break-all;"><a href="${url}" style="color:#4a2a8f;">${url}</a></p>
                <p style="margin:0;font-size:12px;color:#6b6780;">${escapeHtml(footer)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function verificationEmail({ name, url }: { name: string; url: string }): EmailContent {
  const greeting = name.trim() ? `Hola, ${name.trim().split(" ")[0]}.` : "Hola."

  return {
    subject: "Verifica tu correo en Scary Split",
    html: renderLayout({
      preheader: "Confirma tu correo para terminar de crear tu cuenta.",
      title: "¡Bienvenido a la casa del susto! 👻",
      paragraphs: [
        escapeHtml(greeting),
        "Confirma tu correo electrónico para terminar de configurar tu cuenta. Así podrás recuperar tu contraseña y vincular Google cuando quieras."
      ],
      buttonLabel: "Verificar mi correo",
      url,
      footer: "Si no creaste una cuenta en Scary Split, puedes ignorar este correo."
    }),
    text: `${greeting}\n\nConfirma tu correo para terminar de crear tu cuenta en Scary Split:\n${url}\n\nSi no creaste una cuenta, ignora este correo.`
  }
}

export function resetPasswordEmail({ name, url }: { name: string; url: string }): EmailContent {
  const greeting = name.trim() ? `Hola, ${name.trim().split(" ")[0]}.` : "Hola."

  return {
    subject: "Restablece tu contraseña de Scary Split",
    html: renderLayout({
      preheader: "Usa este enlace para elegir una nueva contraseña.",
      title: "Restablece tu contraseña",
      paragraphs: [
        escapeHtml(greeting),
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta. El enlace es válido por 1 hora."
      ],
      buttonLabel: "Elegir nueva contraseña",
      url,
      footer: "Si no fuiste tú, ignora este correo: tu contraseña actual no cambiará."
    }),
    text: `${greeting}\n\nUsa este enlace para restablecer tu contraseña de Scary Split (válido por 1 hora):\n${url}\n\nSi no fuiste tú, ignora este correo.`
  }
}

export function invitationEmail({
  inviterName,
  tripName,
  personName,
  url
}: {
  inviterName: string
  tripName: string
  personName: string
  url: string
}): EmailContent {
  const inviter = inviterName.trim() || "Alguien"

  return {
    subject: `${inviter} te invitó a «${tripName}» en Scary Split`,
    html: renderLayout({
      preheader: `${inviter} te invitó a un sustito de gastos.`,
      title: "¡Te invitaron a un sustito! 👻",
      paragraphs: [
        `<b>${escapeHtml(inviter)}</b> te agregó como <b>${escapeHtml(personName)}</b> en el sustito <b>«${escapeHtml(tripName)}»</b>.`,
        "Únete para ver los gastos, qué te toca pagar y registrar tus pagos. El enlace es válido por 7 días y solo se puede usar una vez."
      ],
      buttonLabel: "Unirme al sustito",
      url,
      footer: "Si no esperabas esta invitación, puedes ignorar este correo."
    }),
    text: `${inviter} te invitó al sustito «${tripName}» como ${personName}.\n\nÚnete aquí (válido por 7 días, un solo uso):\n${url}\n\nSi no esperabas esta invitación, ignora este correo.`
  }
}
