import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignInButton, SignUpButton } from "@clerk/nextjs"

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--color-charcoal)] overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 animate-fade-in-down">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-[var(--color-crimson)] flex items-center justify-center">
                <span className="font-[var(--font-playfair)] text-white font-bold text-sm">M</span>
              </div>
              <span className="font-[var(--font-playfair)] text-xl font-semibold text-white tracking-tight">MRKT</span>
            </div>
            <div className="flex items-center gap-4">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="btn-primary rounded-full bg-[var(--color-crimson)] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--color-crimson)]/20"
                >
                  Get Started
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center geometric-pattern grain-overlay">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-crimson)] rounded-full blur-[128px] opacity-30 animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-[var(--color-crimson-dark)] rounded-full blur-[100px] opacity-25 animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-crimson-deep)] rounded-full blur-[200px] opacity-20" />

        {/* Floating Elements */}
        <div className="absolute top-32 right-[15%] w-20 h-20 border border-white/10 rounded-2xl rotate-12 animate-float delay-200" />
        <div className="absolute bottom-40 left-[10%] w-16 h-16 border border-[var(--color-gold)]/20 rounded-xl -rotate-12 animate-float delay-500" />
        <div className="absolute top-1/2 right-[8%] w-3 h-3 bg-[var(--color-gold)] rounded-full animate-float delay-700" />
        <div className="absolute top-[30%] left-[12%] w-2 h-2 bg-[var(--color-crimson)] rounded-full animate-float delay-400" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <div className="animate-on-load animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm mb-8">
            <span className="h-2 w-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
            <span className="text-sm font-medium text-white/70">Exclusive to Harvard Business School</span>
          </div>

          {/* Main Headline */}
          <h1 className="animate-on-load animate-fade-in-up delay-100 font-[var(--font-playfair)] text-6xl sm:text-7xl lg:text-8xl font-bold text-white leading-[0.95] tracking-tight mb-6">
            The Premier
            <span className="block text-gradient">Ticket Exchange</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-on-load animate-fade-in-up delay-200 mx-auto max-w-2xl text-lg sm:text-xl text-white/60 leading-relaxed mb-10">
            A trusted marketplace built exclusively for the HBS community.
            Buy and sell event tickets with transparent pricing and verified members.
          </p>

          {/* CTA Buttons */}
          <div className="animate-on-load animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignUpButton mode="modal">
              <button
                type="button"
                className="btn-primary group flex items-center gap-3 rounded-full bg-[var(--color-crimson)] px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-[var(--color-crimson)]/30"
              >
                Start Trading
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </SignUpButton>
            <a
              href="#how-it-works"
              className="flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/30"
            >
              <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              See How It Works
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="animate-on-load animate-fade-in-up delay-400 mt-16 flex flex-wrap items-center justify-center gap-8 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified HBS Members</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span>Transparent Pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span>Instant Transfers</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-32 bg-[var(--color-slate)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-charcoal)] to-transparent h-32" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="elegant-divider mx-auto mb-6" />
            <h2 className="font-[var(--font-playfair)] text-4xl sm:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Three simple steps to buy or sell tickets within our trusted community
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card-hover group relative rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-8">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-[var(--color-crimson)] flex items-center justify-center shadow-lg shadow-[var(--color-crimson)]/30">
                <span className="font-[var(--font-playfair)] text-xl font-bold text-white">1</span>
              </div>
              <div className="mt-6 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-crimson)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-[var(--color-crimson)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-[var(--font-playfair)] text-xl font-semibold text-white mb-3">
                Join the Community
              </h3>
              <p className="text-white/50 leading-relaxed">
                Sign up with your HBS credentials. Only verified community members can access the marketplace.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card-hover group relative rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-8">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-[var(--color-crimson)] flex items-center justify-center shadow-lg shadow-[var(--color-crimson)]/30">
                <span className="font-[var(--font-playfair)] text-xl font-bold text-white">2</span>
              </div>
              <div className="mt-6 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-crimson)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-[var(--color-crimson)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-[var(--font-playfair)] text-xl font-semibold text-white mb-3">
                Browse & List
              </h3>
              <p className="text-white/50 leading-relaxed">
                Explore available tickets or list your own. Set your price and let the market work.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card-hover group relative rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-8">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-[var(--color-crimson)] flex items-center justify-center shadow-lg shadow-[var(--color-crimson)]/30">
                <span className="font-[var(--font-playfair)] text-xl font-bold text-white">3</span>
              </div>
              <div className="mt-6 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-crimson)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-[var(--color-crimson)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-[var(--font-playfair)] text-xl font-semibold text-white mb-3">
                Trade Securely
              </h3>
              <p className="text-white/50 leading-relaxed">
                Complete transactions safely with our escrow system. Tickets are transferred instantly upon payment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 bg-[var(--color-charcoal)] overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="font-[var(--font-playfair)] text-5xl sm:text-6xl font-bold text-gradient mb-2">
                500+
              </div>
              <p className="text-white/50 text-sm uppercase tracking-widest">Active Members</p>
            </div>
            <div className="text-center">
              <div className="font-[var(--font-playfair)] text-5xl sm:text-6xl font-bold text-gradient mb-2">
                $50K+
              </div>
              <p className="text-white/50 text-sm uppercase tracking-widest">Traded Volume</p>
            </div>
            <div className="text-center">
              <div className="font-[var(--font-playfair)] text-5xl sm:text-6xl font-bold text-gradient mb-2">
                100%
              </div>
              <p className="text-white/50 text-sm uppercase tracking-widest">Secure Transfers</p>
            </div>
            <div className="text-center">
              <div className="font-[var(--font-playfair)] text-5xl sm:text-6xl font-bold text-gradient mb-2">
                24/7
              </div>
              <p className="text-white/50 text-sm uppercase tracking-widest">Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 bg-[var(--color-slate)]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Text */}
            <div>
              <div className="elegant-divider mb-6" />
              <h2 className="font-[var(--font-playfair)] text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
                Built for the
                <span className="text-[var(--color-crimson)]"> HBS</span> Community
              </h2>
              <p className="text-lg text-white/60 mb-10 leading-relaxed">
                Every feature designed with our unique community needs in mind.
                From exclusive events to trusted peer-to-peer transactions.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-crimson)]/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--color-crimson)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Fair Market Pricing</h3>
                    <p className="text-white/50 text-sm">
                      Transparent bid/ask system ensures fair prices for everyone
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-crimson)]/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--color-crimson)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Verified Identity</h3>
                    <p className="text-white/50 text-sm">
                      Every member is verified with HBS credentials
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-crimson)]/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--color-crimson)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Instant Delivery</h3>
                    <p className="text-white/50 text-sm">
                      Tickets are transferred immediately after purchase
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--color-crimson)]/20 to-[var(--color-crimson-dark)]/20 rounded-3xl blur-2xl" />
              <div className="relative glass rounded-3xl p-8 border border-white/10">
                {/* Mock UI */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-white/50 text-sm uppercase tracking-wider">Live Events</span>
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  </div>

                  {/* Event Cards */}
                  <div className="space-y-3">
                    <div className="rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-medium">HBS Winter Gala</span>
                        <span className="text-[var(--color-gold)] text-sm font-semibold">$85</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 text-xs">Dec 15, 2025</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">12 available</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-medium">Spring Conference</span>
                        <span className="text-[var(--color-gold)] text-sm font-semibold">$120</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 text-xs">Mar 22, 2026</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">5 available</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-medium">Alumni Mixer</span>
                        <span className="text-[var(--color-gold)] text-sm font-semibold">$45</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 text-xs">Jan 8, 2026</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">28 available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 bg-gradient-to-br from-[var(--color-crimson)] via-[var(--color-crimson-dark)] to-[var(--color-crimson-deep)] overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 geometric-pattern opacity-50" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-[var(--font-playfair)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Join the
            <span className="block">Premier Marketplace?</span>
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Join hundreds of HBS community members already trading on MRKT.
            Your next event ticket is just a click away.
          </p>

          <SignUpButton mode="modal">
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-semibold text-[var(--color-crimson)] shadow-2xl shadow-black/30 hover:bg-[var(--color-ivory)]"
            >
              Create Your Account
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </SignUpButton>

          <p className="mt-6 text-sm text-white/50">
            Free to join. No transaction fees for members.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--color-charcoal)] border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-[var(--color-crimson)] flex items-center justify-center">
                <span className="font-[var(--font-playfair)] text-white font-bold text-sm">M</span>
              </div>
              <span className="font-[var(--font-playfair)] text-xl font-semibold text-white tracking-tight">MRKT</span>
            </div>

            <p className="text-white/40 text-sm">
              &copy; 2025 MRKT. Exclusively for the HBS community.
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
