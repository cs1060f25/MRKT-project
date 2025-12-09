/**
 * My Listings Table Component
 *
 * Displays user's asks (listings) with event information, status, and QR upload status.
 * Premium dark theme with glassmorphic styling.
 */

'use client'

import type { Ask } from '@/lib/dashboard/types'
import { formatPrice, formatDateTime, formatStatus, getStatusColor } from '@/lib/utils/format'
import { EmptyState } from '@/components/common/EmptyState'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface MyListingsTableProps {
  listings: Ask[]
}

export function MyListingsTable({ listings }: MyListingsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(askId: string) {
    if (!askId) return
    const confirm = window.confirm('Delete this listing? This action cannot be undone.')
    if (!confirm) return
    try {
      setDeletingId(askId)
      const res = await fetch(`/api/listings/${askId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to delete listing')
      }
      router.refresh()
    } catch (err) {
      console.error('[MyListingsTable] Delete error:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete listing')
    } finally {
      setDeletingId(null)
    }
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        title="No listings yet"
        description="Create your first listing to start selling tickets."
        action={{
          label: 'Create Listing',
          disabled: true,
        }}
      />
    )
  }

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              Event
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              Price Floor
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              Quantity
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              QR Status
            </th>
            <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {listings.map((listing) => {
            const hasQR = !!listing.qr_storage_path
            return (
              <tr key={listing.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-white">{listing.event.title}</div>
                  <div className="text-sm text-white/50">{formatDateTime(listing.event.starts_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-[var(--color-gold)] font-medium">{formatPrice(listing.price_cents)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{listing.qty}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(listing.status)}`}>
                    {formatStatus(listing.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {hasQR ? (
                    <span className="inline-flex items-center text-green-400 text-sm">
                      <svg className="w-5 h-5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-400 text-sm">
                      <svg className="w-5 h-5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Missing
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end gap-4">
                    <button
                      type="button"
                      disabled
                      title="QR upload coming soon"
                      className="text-white/30 cursor-not-allowed font-medium"
                    >
                      Upload QR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(listing.id)}
                      disabled={listing.status !== 'open' || deletingId === listing.id}
                      className={`font-medium transition-colors ${
                        listing.status !== 'open' || deletingId === listing.id
                          ? 'text-white/30 cursor-not-allowed'
                          : 'text-red-400 hover:text-red-300'
                      }`}
                      title={listing.status !== 'open' ? 'Only open listings can be deleted' : 'Delete listing'}
                    >
                      {deletingId === listing.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
