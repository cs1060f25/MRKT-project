export default function Home() {
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
              <button
                type="button"
                className="inline-flex items-center rounded-full bg-white px-6 py-3 font-medium text-[var(--color-crimson)] shadow-sm transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                aria-label="Log in"
              >
                Log in
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
