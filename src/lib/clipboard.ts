/**
 * Copia texto al portapapeles. Acepta una promesa para poder esperar a una server action sin perder el gesto del
 * usuario: Safari/iOS exigen iniciar la copia dentro del clic, y ClipboardItem admite que el texto se resuelva después.
 */
export async function copyToClipboard(textPromise: Promise<string>) {
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined" && window.isSecureContext) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": textPromise.then((text) => new Blob([text], { type: "text/plain" }))
      })
    ])
    return
  }

  const text = await textPromise

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Fallback para contextos no seguros (http) donde navigator.clipboard no existe
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  try {
    if (!document.execCommand("copy")) {
      throw new Error("No se pudo copiar al portapapeles")
    }
  } finally {
    document.body.removeChild(textarea)
  }
}
