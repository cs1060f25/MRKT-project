import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/events/[id]/analytics - Get event analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication to view analytics
    await requireAuth();

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

    // Get all listings for this event
    const listings = await prisma.listing.findMany({
      where: { eventId: id },
      include: {
        trades: true,
      },
    });

    // Get all trades for this event
    const trades = await prisma.trade.findMany({
      where: {
        listing: {
          eventId: id,
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Calculate metrics
    const totalListings = listings.length;
    const totalTrades = trades.length;
    const completedListings = listings.filter((l) => l.status === 'SOLD').length;

    const sellThroughRate =
      totalListings > 0 ? (completedListings / totalListings) * 100 : 0;

    const avgResalePrice =
      totalTrades > 0
        ? trades.reduce((sum, trade) => sum + trade.price, 0) / totalTrades
        : 0;

    const minPrice = trades.length > 0 ? Math.min(...trades.map((t) => t.price)) : 0;
    const maxPrice = trades.length > 0 ? Math.max(...trades.map((t) => t.price)) : 0;

    // Calculate price distribution
    const priceRanges = [
      { label: 'Below Retail', min: 0, max: event.retailPrice, count: 0 },
      { label: 'At Retail', min: event.retailPrice, max: event.retailPrice, count: 0 },
      { label: 'Above Retail', min: event.retailPrice, max: Infinity, count: 0 },
    ];

    trades.forEach((trade) => {
      if (trade.price < event.retailPrice) {
        priceRanges[0].count++;
      } else if (trade.price === event.retailPrice) {
        priceRanges[1].count++;
      } else {
        priceRanges[2].count++;
      }
    });

    // Group trades by day for time series
    const tradesByDay = trades.reduce((acc, trade) => {
      const day = new Date(trade.completedAt).toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { date: day, count: 0, totalVolume: 0, avgPrice: 0 };
      }
      acc[day].count++;
      acc[day].totalVolume += trade.price;
      return acc;
    }, {} as Record<string, { date: string; count: number; totalVolume: number; avgPrice: number }>);

    // Calculate average price for each day
    const timeSeriesData = Object.values(tradesByDay).map((day) => ({
      ...day,
      avgPrice: day.totalVolume / day.count,
    }));

    return NextResponse.json({
      success: true,
      analytics: {
        event: {
          id: event.id,
          title: event.title,
          retailPrice: event.retailPrice,
          eventDateTime: event.eventDateTime,
        },
        metrics: {
          totalListings,
          totalTrades,
          completedListings,
          sellThroughRate: Math.round(sellThroughRate * 10) / 10, // Round to 1 decimal
          avgResalePrice: Math.round(avgResalePrice * 100) / 100, // Round to 2 decimals
          minPrice: Math.round(minPrice * 100) / 100,
          maxPrice: Math.round(maxPrice * 100) / 100,
        },
        priceDistribution: priceRanges,
        timeSeries: timeSeriesData,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    console.error('Get analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
