import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getServiceClient({
      functionName: 'matching-algorithm',
      traceId: crypto.randomUUID() // Simple trace ID
    })

    // 1. Fetch Open Asks (Sorted by Price ASC, Created At ASC)
    // Cheapest asks first - maximizes transaction count
    const { data: asks, error: asksError } = await supabase
      .from('asks')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'open')
      .order('price_cents', { ascending: true })
      .order('created_at', { ascending: true })

    if (asksError) throw asksError

    // 2. Fetch Open Bids (Sorted by Price ASC, Created At ASC)
    // Lowest bids first - pairs cheapest viable bid with cheapest ask
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'open')
      .order('price_cents', { ascending: true })
      .order('created_at', { ascending: true })

    if (bidsError) throw bidsError

    let matchesCount = 0
    const matchesToCreate = []
    const ticketsToCreate = []
    const asksToUpdate = []
    const bidsToUpdate = []

    // 3. Matching Logic - Two-Pointer Algorithm for Maximum Liquidity
    // Both lists sorted ascending: pairs cheapest ask with cheapest viable bid
    // This maximizes the number of successful transactions
    let askIdx = 0
    let bidIdx = 0

    while (askIdx < asks.length && bidIdx < bids.length) {
      const ask = asks[askIdx]
      const bid = bids[bidIdx]

      // Skip exhausted orders
      if (ask.qty <= 0) { askIdx++; continue }
      if (bid.qty <= 0) { bidIdx++; continue }

      // Rule: No self-matching
      if (ask.seller_id === bid.buyer_id) { bidIdx++; continue }

      // Rule: Bid must be >= Ask
      if (bid.price_cents >= ask.price_cents) {
        // Match found!
        const matchQty = Math.min(ask.qty, bid.qty)
        const clearingPrice = ask.price_cents // Clearing price = ask floor
        const matchId = crypto.randomUUID()

        // Prepare Match Record
        matchesToCreate.push({
          id: matchId,
          event_id: eventId,
          ask_id: ask.id,
          bid_id: bid.id,
          clearing_price_cents: clearingPrice,
          qty: matchQty
        })

        // Create ticket if QR code exists
        if (ask.qr_storage_path) {
          ticketsToCreate.push({
            id: crypto.randomUUID(),
            match_id: matchId,
            winner_id: bid.buyer_id,
            qr_storage_path: ask.qr_storage_path,
            delivered_at: new Date().toISOString(),
          })
        }

        // Update quantities
        ask.qty -= matchQty
        bid.qty -= matchQty
        matchesCount++

        // Advance pointers for exhausted orders
        if (ask.qty <= 0) askIdx++
        if (bid.qty <= 0) bidIdx++
      } else {
        // Bid too low for this ask - try next bid
        bidIdx++
      }
    }

    // 4. Execute Updates
    // Group updates by ID to handle multiple partial matches on same order
    const askUpdates = new Map()
    for (const ask of asks) {
      // Only update if changed
      // We can check against original DB value, but `asks` is mutable here.
      // We need to compare with initial state or just check if we touched it?
      // Actually, we modified `ask.qty` in place.
      // We can compare it to the original qty? 
      // But we didn't keep a deep copy. 
      // We can just assume if we processed it we might have changed it?
      // Better: check if qty changed or status needs update.
      // But we lost original qty.
      // Let's rely on the logic: if matches were made involving this ask.
      
      // Actually, cleaner way:
      // Just check status. If qty reached 0, status -> 'matched'.
      // If qty > 0 but < original, status -> 'open' (unchanged), but qty updated.
      // We need to know IF it changed.
      // Let's just track which IDs participated in matches.
      const participated = matchesToCreate.some(m => m.ask_id === ask.id)
      if (participated) {
        if (ask.qty === 0) {
          // Fully matched - only update status, keep original qty as historical record
          // (qty > 0 constraint prevents setting qty = 0)
          askUpdates.set(ask.id, { status: 'matched' })
        } else {
          // Partially matched - update both qty and keep status open
          askUpdates.set(ask.id, { qty: ask.qty, status: 'open' })
        }
      }
    }

    const bidUpdates = new Map()
    for (const bid of bids) {
      const participated = matchesToCreate.some(m => m.bid_id === bid.id)
      if (participated) {
        if (bid.qty === 0) {
          // Fully matched - only update status, keep original qty as historical record
          // (qty > 0 constraint prevents setting qty = 0)
          bidUpdates.set(bid.id, { status: 'matched' })
        } else {
          // Partially matched - update both qty and keep status open
          bidUpdates.set(bid.id, { qty: bid.qty, status: 'open' })
        }
      }
    }

    // Execute Transactions
    // Note: Supabase JS client doesn't support massive batch transactions easily without RPC.
    // For this prototype, we will execute them in parallel/sequence. 
    // Ideally this whole logic should be inside a Postgres Function (RPC) for atomicity.
    // Given the instructions to "build out the matching algorithm" in Typescript (implied by context of Plan),
    // I will do it here.
    
    // Insert Matches
    if (matchesToCreate.length > 0) {
      const { error: matchInsertError } = await supabase
        .from('matches')
        .insert(matchesToCreate)
      
      if (matchInsertError) throw matchInsertError

      // Insert Tickets (only if there are tickets to create)
      if (ticketsToCreate.length > 0) {
        const { error: ticketInsertError } = await supabase
          .from('tickets')
          .insert(ticketsToCreate)

        if (ticketInsertError) throw ticketInsertError
      }

      // Update Asks
      for (const [id, update] of askUpdates) {
        const { error } = await supabase
          .from('asks')
          .update(update)
          .eq('id', id)
        if (error) throw error
      }

      // Update Bids
      for (const [id, update] of bidUpdates) {
        const { error } = await supabase
          .from('bids')
          .update(update)
          .eq('id', id)
        if (error) throw error
      }
    }

    return NextResponse.json({ 
      success: true, 
      matchesCount: matchesToCreate.length,
      matches: matchesToCreate 
    })

  } catch (error) {
    console.error('Matching algorithm error:', error)
    return NextResponse.json(
      { error: 'Failed to execute matching algorithm' },
      { status: 500 }
    )
  }
}

