import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

const KEY_LENGTH = 64
const COST = 16384

function derive(password: string, salt: Buffer, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N: cost }, (error, key) => (error ? reject(error) : resolve(key)))
  })
}

/** Formato: scrypt$costo$salt$hash (base64) */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt, COST)

  return ["scrypt", COST, salt.toString("base64"), key.toString("base64")].join("$")
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, cost, salt, hash] = stored.split("$")

  if (scheme !== "scrypt" || !cost || !salt || !hash) {
    return false
  }

  const expected = Buffer.from(hash, "base64")
  const actual = await derive(password, Buffer.from(salt, "base64"), Number(cost))

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

let dummyHash: Promise<string> | undefined

/** Hash descartable para que el login tarde lo mismo cuando el correo no existe. */
export function getDummyHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"))

  return dummyHash
}
