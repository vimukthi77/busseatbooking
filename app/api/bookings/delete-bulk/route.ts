// app/api/bookings/delete-bulk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Bookings';
import { verifyToken, hasPermission } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!hasPermission(decoded.role, 'bookings:delete')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Forbidden'
      }, { status: 403 });
    }

    const body = await request.json();
    const { bookingIds, action = 'cancel' } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Booking IDs are required'
      }, { status: 400 });
    }

    if (!['cancel'].includes(action)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid action. Must be "cancel"'
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if all bookings exist
    const existingBookings = await Booking.find({
      _id: { $in: bookingIds }
    });

    if (existingBookings.length !== bookingIds.length) {
      const foundIds = existingBookings.map(b => b._id.toString());
      const missingIds = bookingIds.filter(id => !foundIds.includes(id));
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `Some bookings not found: ${missingIds.join(', ')}`
      }, { status: 400 });
    }

    let message: string;
    let count: number;

    if (action === 'cancel') {
      // Check if any bookings are already cancelled
      const cancelledBookings = existingBookings.filter(b => b.status === 'cancelled');
      if (cancelledBookings.length > 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: `Some bookings are already cancelled: ${cancelledBookings.map(b => b._id).join(', ')}`
        }, { status: 400 });
      }

      // Bulk update to cancelled status (soft delete)
      const result = await Booking.updateMany(
        { _id: { $in: bookingIds } },
        { status: 'cancelled' }
      );
      count = result.modifiedCount;
      message = `${count} booking(s) cancelled successfully`;
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid action'
      }, { status: 400 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message,
      data: {
        action,
        count
      }
    });
  } catch (error) {
    console.error('Error bulk deleting bookings:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Error cancelling bookings'
    }, { status: 500 });
  }
}
