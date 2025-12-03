/**
 * My Tickets Table Component
 *
 * Displays user's tickets (as winner) with event information and delivery status.
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
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal} />

            {/* Modal Panel */}
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={closeModal}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                    {modal.ticket?.event.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {modal.ticket && formatDateTime(modal.ticket.event.starts_at)}
                  </p>

                  <div className="mt-4">
                    {modal.loading && (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-500">Loading ticket...</span>
                      </div>
                    )}

                    {modal.error && (
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{modal.error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {modal.imageUrl && (
                      <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
                          <img
                            src={modal.imageUrl}
                            alt="Ticket QR Code"
                            className="w-full h-auto max-h-96 object-contain mx-auto"
                          />
                        </div>
                        <a
                          href={modal.imageUrl}
                          download={`ticket-${modal.ticket?.id}.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Download Ticket
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Match Price
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Match Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Delivered
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{ticket.event.title}</div>
                <div className="text-sm text-gray-500">{formatDateTime(ticket.event.starts_at)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatPrice(ticket.match.clearing_price_cents)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDateTime(ticket.match.created_at)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {ticket.delivered_at ? (
                  <span className="inline-flex items-center text-green-600 text-sm">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {formatDateTime(ticket.delivered_at)}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-yellow-600 text-sm">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
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
                      ? 'text-indigo-600 hover:text-indigo-900 font-medium'
                      : 'text-gray-400 cursor-not-allowed font-medium'
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
