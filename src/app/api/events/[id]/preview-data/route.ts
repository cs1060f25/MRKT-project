import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/events/[id]/preview-data - Get preview data (listings and trades) for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Get event
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: 'Event not found',
        },
        { status: 404 }
      );
    }

    // Get active listings
    const listings = await prisma.listing.findMany({
      where: {
        eventId: id,
        status: 'ACTIVE',
      },
      orderBy: {
        price: 'asc',
      },
      select: {
        id: true,
        price: true,
        createdAt: true,
      },
    });

    // Get recent trades for price chart
    const trades = await prisma.trade.findMany({
      where: {
        listing: {
          eventId: id,
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 30, // Last 30 trades
      select: {
        id: true,
        price: true,
        completedAt: true,
      },
    });

    // Calculate liquidity metrics
    const listingCount = listings.length;
    const avgListingPrice =
      listingCount > 0
        ? listings.reduce((sum, l) => sum + l.price, 0) / listingCount
        : event.retailPrice;

    return NextResponse.json({
      success: true,
      data: {
        listingCount,
        avgListingPrice: Math.round(avgListingPrice * 100) / 100,
        listings: listings.slice(0, 5), // Top 5 cheapest listings
        trades: trades.reverse(), // Chronological order
      },
    });
  } catch (error) {
    console.error('Get preview data error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch preview data',
      },
      { status: 500 }
    );
  }
}
