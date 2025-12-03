/**
 * Sell Success Page
 *
 * Confirmation page shown after successfully creating a listing.
 * Provides options to view dashboard or create another listing.
 * Premium dark theme styling.
 */

import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Listing Created | MRKT',
  description: 'Your listing has been created successfully',
}

export default async function SellSuccessPage() {
  // ============================================================================
  // Authentication Check
  // ============================================================================
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // ============================================================================
  // Render Success Message
  // ============================================================================
  return (
    <div className="min-h-screen bg-[var(--color-charcoal)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Card */}
        <div className="mt-12 glass rounded-2xl border border-white/10 p-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/20 p-4 border border-green-500/30">
              <svg
                className="h-12 w-12 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="mt-6 text-center">
            <h1 className="font-[var(--font-playfair)] text-2xl font-bold text-white">
              Listing Created Successfully!
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Your event ticket listing has been posted to the marketplace. Buyers can now see your listing and submit bids.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex justify-center items-center rounded-lg bg-[var(--color-crimson)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-crimson)]/20 hover:bg-[var(--color-crimson-dark)] transition-colors"
            >
              View Dashboard
            </Link>
            <Link
              href="/sell/create"
              className="inline-flex justify-center items-center rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white border border-white/20 hover:bg-white/20 transition-colors"
            >
              Create Another Listing
            </Link>
          </div>

          {/* Info Box */}
          <div className="mt-8 rounded-xl border border-[var(--color-gold)]/20 bg-[var(--color-gold)]/10 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-[var(--color-gold)]"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-[var(--color-gold)]">
                  What happens next?
                </h3>
                <div className="mt-2 text-sm text-white/60">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Your listing is now visible to buyers on the marketplace
                    </li>
                    <li>
                      You'll be notified when a buyer's bid matches your floor price
                    </li>
                    <li>
                      You can view and manage your listings in the Dashboard under "My Listings"
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
