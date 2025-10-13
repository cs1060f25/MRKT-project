import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventUpdateSchema, eventIdSchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth';
import { ZodError } from 'zod';

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        listings: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            price: 'asc',
          },
          take: 10,
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
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

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch event',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id] - Update event (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const validatedData = eventUpdateSchema.parse({ ...body, id });

    const event = await prisma.event.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
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

    console.error('Update event error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update event',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
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

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin access required',
        },
        { status: 403 }
      );
    }

    console.error('Delete event error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete event',
      },
      { status: 500 }
    );
  }
}
