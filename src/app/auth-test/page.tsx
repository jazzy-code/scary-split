"use client"

import { FormEvent, useState } from "react"

import { authClient } from "@/lib/auth-client"

export default function AuthTestPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const { data: session, isPending } = authClient.useSession()

  async function handleGoogleSignIn() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth-test"
    })
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const { error } = await authClient.signUp.email({
      name,
      email,
      password
    })

    if (error) {
      setMessage(error.message || "Sign up failed")
      return
    }

    setMessage("Account created")
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const { error } = await authClient.signIn.email({
      email,
      password
    })

    if (error) {
      setMessage(error.message || "Sign in failed")
      return
    }

    setMessage("Signed in")
  }

  async function handleSignOut() {
    const { error } = await authClient.signOut()

    if (error) {
      setMessage(error.message || "Sign out failed")
      return
    }

    setMessage("Signed out")
  }

  if (isPending) {
    return <div>Loading...</div>
  }

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Better Auth Test</h1>

      {session ? (
        <div className="space-y-4">
          <div>
            <p>Authenticated</p>
            <p>{session.user.name}</p>
            <p>{session.user.email}</p>
          </div>

          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <form onSubmit={handleSignUp} className="space-y-4">
            <h2 className="text-xl font-semibold">Sign up</h2>

            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button type="submit">Create account</button>
          </form>

          <form onSubmit={handleSignIn} className="space-y-4">
            <h2 className="text-xl font-semibold">Sign in</h2>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button type="submit">Sign in</button>

            <button type="button" onClick={handleGoogleSignIn}>
              Continue with Google
            </button>
          </form>
        </div>
      )}

      {message && <p className="mt-6">{message}</p>}
    </main>
  )
}
