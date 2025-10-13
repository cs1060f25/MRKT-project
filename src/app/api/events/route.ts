import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventCreateSchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth';
import { ZodError } from 'zod';

// GET /api/events - List all events
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'upcoming', 'past', 'all'

    let whereClause: any = {};

    if (status === 'upcoming') {
      whereClause.eventDateTime = { gte: new Date() };
    } else if (status === 'past') {
      whereClause.eventDateTime = { lt: new Date() };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            listings: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        eventDateTime: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch events',
      },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    await requireAdmin();

    const body = await request.json();
    const validatedData = eventCreateSchema.parse(body);

    const event = await prisma.event.create({
      data: validatedData,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Event created successfully',
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin access required',
        },
        { status: 403 }
      );
    }

    console.error('Create event error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create event',
      },
      { status: 500 }
    );
  }
}
