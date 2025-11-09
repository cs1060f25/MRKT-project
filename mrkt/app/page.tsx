import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignInButton } from "@clerk/nextjs"

export default async function Home() {
  // Check if user is authenticated
  const { userId } = await auth()

  // If authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard')
  }

  // If not authenticated, show landing page
  return (
    <div className="min-h-screen bg-white">
      <main className="flex min-h-screen flex-col">
        <section className="flex flex-1 items-center justify-center bg-[var(--color-crimson)] text-white">
          <div className="max-w-3xl px-6 py-24 text-center">
            <h1 className="text-5xl font-bold tracking-tight">MRKT</h1>
            <p className="mt-4 text-lg leading-8 opacity-95">
              The HBS exclusive market for fair event pricing and ticket discovery.
            </p>
            <div className="mt-8">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 font-medium text-[var(--color-crimson)] shadow-sm transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  aria-label="Log in"
                >
                  Log in
                </button>
              </SignInButton>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
