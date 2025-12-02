'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ExecuteMatchingButtonProps {
  eventId: string
}

export function ExecuteMatchingButton({ eventId }: ExecuteMatchingButtonProps) {
  const [isMatching, setIsMatching] = useState(false)
  const router = useRouter()

  async function handleExecuteMatching() {
    try {
      setIsMatching(true)
      
      const response = await fetch(`/api/events/${eventId}/match`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to execute matching')
      }

      const result = await response.json()
      
      // Force a refresh to show updated order book and matches
      router.refresh()
      
      if (result.matchesCount > 0) {
        alert(`Successfully executed matching! ${result.matchesCount} match(es) created.`)
      } else {
        alert('Matching executed. No new matches found.')
      }
    } catch (error) {
      console.error('Matching error:', error)
      alert('Failed to execute matching algorithm')
    } finally {
      setIsMatching(false)
    }
  }

  return (
    <button
      onClick={handleExecuteMatching}
      disabled={isMatching}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
        ${isMatching ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
    >
      {isMatching ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : (
        'Execute Matching'
      )}
    </button>
  )
}

