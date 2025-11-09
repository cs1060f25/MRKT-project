/**
 * Seed Database API Route
 * 
 * Loads dummy data into the database for testing
 * Uses service role key to bypass RLS
 */

import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = getServiceClient({
      functionName: 'seed-database',
      traceId: 'seed-operation'
    })

    // Insert test users
    const { error: usersError } = await supabase
      .from('users')
      .upsert([
        {
          id: 'user_34vzEy76jAWsF3V3TxIo2miUmJk',
          email: 'jlinsdell@mba2026.hbs.edu',
          full_name: 'Jamie Linsdell',
        },
        {
          id: 'user_test_seller_123456789abc',
          email: 'seller@test.com',
          full_name: 'Test Seller',
        },
        {
          id: 'user_test_buyer_987654321xyz',
          email: 'buyer@test.com',
          full_name: 'Test Buyer',
        },
      ], { onConflict: 'id' })

    if (usersError) throw usersError

    // Insert events
    const now = new Date()
    const { error: eventsError } = await supabase
      .from('events')
      .insert([
        {
          id: '33333333-3333-3333-3333-333333333333',
          title: 'Fall Networking Mixer',
          starts_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ends_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
          org: 'Tech Club',
          created_by: 'user_test_seller_123456789abc',
        },
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          title: 'Wine & Cheese Social',
          starts_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          ends_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          org: 'Finance Club',
          created_by: 'user_test_seller_123456789abc',
        },
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          title: 'Guest Speaker: Tech in Finance',
          starts_at: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          ends_at: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
          org: 'Fintech Society',
          created_by: 'user_34vzEy76jAWsF3V3TxIo2miUmJk',
        },
        {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          title: 'Career Trek: Silicon Valley',
          starts_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          ends_at: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString(),
          org: 'Career Development',
          created_by: 'user_test_buyer_987654321xyz',
        },
        {
          id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          title: 'Annual Gala Dinner',
          starts_at: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          ends_at: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
          org: 'Student Association',
          created_by: 'user_test_buyer_987654321xyz',
        },
        {
          id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          title: 'Startup Pitch Competition',
          starts_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          ends_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          org: 'Entrepreneurship Club',
          created_by: 'user_test_seller_123456789abc',
        },
      ])

    if (eventsError) throw eventsError

    // Insert asks
    const { error: asksError } = await supabase
      .from('asks')
      .insert([
        {
          id: '44444444-4444-4444-4444-444444444444',
          event_id: '33333333-3333-3333-3333-333333333333',
          seller_id: 'user_test_seller_123456789abc',
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test/seller-qr.png',
          status: 'open',
        },
        {
          id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          seller_id: 'user_test_seller_123456789abc',
          price_cents: 3500,
          qty: 1,
          qr_storage_path: 'test/wine-cheese-qr.png',
          status: 'open',
        },
        {
          id: '11111111-2222-3333-4444-555555555555',
          event_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          seller_id: 'user_test_seller_123456789abc',
          price_cents: 7500,
          qty: 3,
          qr_storage_path: 'test/pitch-comp-qr.png',
          status: 'open',
        },
      ])

    if (asksError) throw asksError

    // Insert bids
    const { error: bidsError } = await supabase
      .from('bids')
      .insert([
        {
          id: '55555555-5555-5555-5555-555555555555',
          event_id: '33333333-3333-3333-3333-333333333333',
          buyer_id: 'user_test_buyer_987654321xyz',
          price_cents: 4500,
          qty: 1,
          status: 'open',
        },
        {
          id: '66666666-6666-6666-6666-666666666666',
          event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          buyer_id: 'user_test_buyer_987654321xyz',
          price_cents: 3000,
          qty: 1,
          status: 'open',
        },
        {
          id: '77777777-7777-7777-7777-777777777777',
          event_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          buyer_id: 'user_test_buyer_987654321xyz',
          price_cents: 15000,
          qty: 2,
          status: 'open',
        },
      ])

    if (bidsError) throw bidsError

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        users: 3,
        events: 6,
        asks: 3,
        bids: 3,
      },
    })
  } catch (error: any) {
    console.error('[/api/seed] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed database' },
      { status: 500 }
    )
  }
}

