/**
 * My Tickets Table Component
 *
 * Displays user's tickets (as winner) with event information and delivery status.
 * Premium dark theme with glassmorphic styling and modal.
 */

'use client'

import { useState } from 'react'
import type { Ticket } from '@/lib/dashboard/types'
import { formatDateTime, formatPrice } from '@/lib/utils/format'
import { EmptyState } from '@/components/common/EmptyState'

interface MyTicketsTableProps {
  tickets: Ticket[]
}

interface TicketModalState {
  isOpen: boolean
  ticket: Ticket | null
  imageUrl: string | null
  loading: boolean
  error: string | null
}

export function MyTicketsTable({ tickets }: MyTicketsTableProps) {
  const [modal, setModal] = useState<TicketModalState>({
    isOpen: false,
    ticket: null,
    imageUrl: null,
    loading: false,
    error: null,
  })

  const handleViewTicket = async (ticket: Ticket) => {
    if (!ticket.qr_storage_path) {
      setModal({
        isOpen: true,
        ticket,
        imageUrl: null,
        loading: false,
        error: 'No ticket image available',
      })
      return
    }

    setModal({
      isOpen: true,
      ticket,
      imageUrl: null,
      loading: true,
      error: null,
    })

    try {
      // Fetch signed URL from API
      const response = await fetch('/api/tickets/get-qr-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: ticket.qr_storage_path }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load ticket')
      }

      const data = await response.json()
      setModal(prev => ({
        ...prev,
        imageUrl: data.url,
        loading: false,
      }))
    } catch (err) {
      setModal(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load ticket',
      }))
    }
  }

  const closeModal = () => {
    setModal({
      isOpen: false,
      ticket: null,
      imageUrl: null,
      loading: false,
      error: null,
    })
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No tickets yet"
        description="Win a bid to receive your first ticket."
      />
    )
  }

  return (
    <>
      {/* Ticket Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={closeModal} />

            {/* Modal Panel */}
            <div className="relative transform overflow-hidden rounded-2xl glass border border-white/10 px-6 pb-6 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-8">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-lg bg-white/10 p-2 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                  onClick={closeModal}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div>
                <h3 className="font-[var(--font-playfair)] text-xl font-semibold text-white" id="modal-title">
                  {modal.ticket?.event.title}
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  {modal.ticket && formatDateTime(modal.ticket.event.starts_at)}
                </p>

                <div className="mt-6">
                  {modal.loading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[var(--color-crimson)]"></div>
                      <span className="ml-3 text-white/50">Loading ticket...</span>
                    </div>
                  )}

                  {modal.error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                        <p className="ml-3 text-sm text-red-400">{modal.error}</p>
                      </div>
                    </div>
                  )}

                  {modal.imageUrl && (
                    <div className="space-y-4">
                      <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10 p-4">
                        <img
                          src={modal.imageUrl}
                          alt="Ticket QR Code"
                          className="w-full h-auto max-h-96 object-contain mx-auto rounded-lg"
                        />
                      </div>
                      <a
                        href={modal.imageUrl}
                        download={`ticket-${modal.ticket?.id}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex w-full justify-center items-center gap-2 rounded-lg bg-[var(--color-crimson)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--color-crimson)]/20 hover:bg-[var(--color-crimson-dark)] transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Ticket
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Event
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Match Price
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Match Date
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Delivered
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-white">{ticket.event.title}</div>
                  <div className="text-sm text-white/50">{formatDateTime(ticket.event.starts_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-[var(--color-gold)] font-medium">
                    {formatPrice(ticket.match.clearing_price_cents)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white/50">{formatDateTime(ticket.match.created_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {ticket.qr_storage_path ? (
                    <span className="inline-flex items-center text-green-400 text-sm">
                      <svg className="w-5 h-5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-yellow-400 text-sm">
                      <svg className="w-5 h-5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    type="button"
                    onClick={() => handleViewTicket(ticket)}
                    disabled={!ticket.qr_storage_path}
                    className={
                      ticket.qr_storage_path
                        ? 'text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 font-medium transition-colors'
                        : 'text-white/30 cursor-not-allowed font-medium'
                    }
                  >
                    View Ticket
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
