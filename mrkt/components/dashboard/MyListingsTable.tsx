/**
 * My Listings Table Component
 *
 * Displays user's asks (listings) with event information, status, and QR upload status.
 */

'use client'

import type { Ask } from '@/lib/dashboard/types'
import { formatPrice, formatDateTime, formatStatus, getStatusColor } from '@/lib/utils/format'
import { EmptyState } from '@/components/common/EmptyState'

interface MyListingsTableProps {
  listings: Ask[]
}

export function MyListingsTable({ listings }: MyListingsTableProps) {
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
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price Floor
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              QR Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {listings.map((listing) => {
            const hasQR = !!listing.qr_storage_path
            return (
              <tr key={listing.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{listing.event.title}</div>
                  <div className="text-sm text-gray-500">{formatDateTime(listing.event.starts_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatPrice(listing.price_cents)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{listing.qty}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(listing.status)}`}>
                    {formatStatus(listing.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {hasQR ? (
                    <span className="inline-flex items-center text-green-600 text-sm">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-600 text-sm">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Missing
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    type="button"
                    disabled
                    title="QR upload coming soon"
                    className="text-gray-400 cursor-not-allowed font-medium"
                  >
                    Upload QR
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
