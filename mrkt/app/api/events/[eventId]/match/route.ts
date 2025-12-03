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

    // 1. Fetch Open Asks (Sorted by Price DESC, Created At ASC)
    // "Start with the highest ask ticket"
    const { data: asks, error: asksError } = await supabase
      .from('asks')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'open')
      .order('price_cents', { ascending: false })
      .order('created_at', { ascending: true })

    if (asksError) throw asksError

    // 2. Fetch Open Bids (Sorted by Price DESC, Created At ASC)
    // "match the highest bid to that ticket"
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'open')
      .order('price_cents', { ascending: false })
      .order('created_at', { ascending: true })

    if (bidsError) throw bidsError

    let matchesCount = 0
    const matchesToCreate = []
    const ticketsToCreate = []
    const asksToUpdate = []
    const bidsToUpdate = []

    // 3. Matching Logic
    // Iterate through Asks (Highest -> Lowest)
    for (const ask of asks) {
      if (ask.qty <= 0) continue

      // For each Ask, find eligible Bids
      for (const bid of bids) {
        if (bid.qty <= 0) continue

        // Rule: No self-matching
        if (ask.seller_id === bid.buyer_id) continue

        // Rule: Bid must be >= Ask
        // Since Bids are sorted by Price DESC, if we hit a bid lower than ask, 
        // no subsequent bids will match this ask either.
        if (bid.price_cents < ask.price_cents) break

        // Match found!
        // Rule: Quantity matching
        const matchQty = Math.min(ask.qty, bid.qty)

        // Rule: Clearing price = Ask floor
        const clearingPrice = ask.price_cents

        // Generate IDs
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

        // Prepare Ticket Record(s) - One per unit or one per match?
        // The schema has `tickets` linked to `match_id`.
        // Usually tickets are individual items. 
        // The `tickets` table has `match_id` FK. 
        // If match qty is 2, do we create 1 ticket record or 2?
        // Schema: `create table public.tickets ( match_id uuid ... qr_storage_path text ... )`
        // It seems `tickets` table represents the transferred asset.
        // If I buy 2 tickets, I probably expect 2 QR codes?
        // However, the `asks` table has `qr_storage_path`.
        // If the ask has `qty > 1` but only one `qr_storage_path`, it implies the QR is for the batch or they are identical?
        // Or maybe `asks` should have multiple QRs?
        // Looking at schema: `asks` has `qty` and `qr_storage_path` (singular).
        // This suggests either the QR code allows entry for N people, or it's a simplification.
        // I will create ONE ticket record per MATCH for now, preserving the `qr_storage_path`.
        // Wait, if I sell 2 tickets to Person A, and 1 to Person B.
        // I have 1 Match for A (qty 2) and 1 Match for B (qty 1).
        // Each Match gets a Ticket record.
        // That seems consistent with the schema structure.

        // Only create ticket if QR code exists
        // If QR is missing, match still succeeds but ticket creation is deferred
        if (ask.qr_storage_path) {
          ticketsToCreate.push({
            id: crypto.randomUUID(),
            match_id: matchId,
            winner_id: bid.buyer_id,
            qr_storage_path: ask.qr_storage_path,
            // Auto-deliver: ticket is immediately available since QR was uploaded at listing time
            delivered_at: new Date().toISOString(),
          })
        }

        // Update In-Memory Quantities
        ask.qty -= matchQty
        bid.qty -= matchQty
        matchesCount++

        // If ask is exhausted, move to next ask
        if (ask.qty <= 0) break

        // Prepare Updates
        // We defer DB updates to ensure we track the final state of each Ask/Bid
        // But since we might match one Ask multiple times, or one Bid multiple times,
        // we need to be careful not to overwrite previous updates in the list.
        // Simplest strategy: Track modified IDs and final state.
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

