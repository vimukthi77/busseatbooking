import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Bookings';
import Bus from '@/models/Bus';
import Route from '@/models/Route';
import { ApiResponse } from '@/types';

// GET booking by orderId (for success page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    console.log('🔍 [GET /api/public/booking] Looking for order:', orderId);

    if (!orderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    await connectToDatabase();
    
    const booking = await Booking.findOne({ orderId })
      .populate('busId', 'busNumber type capacity departureTime contactNumber')
      .populate('routeId', 'name fromLocation toLocation price pickupLocations');

    if (!booking) {
      console.log('❌ [GET /api/public/booking] Booking not found for order:', orderId);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Booking not found'
      }, { status: 404 });
    }

    console.log('✅ [GET /api/public/booking] Booking found:', booking._id);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Booking fetched successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ [GET /api/public/booking] Error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Error fetching booking'
    }, { status: 500 });
  }
}

// PUT update booking status (for success page)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    console.log('🔄 [PUT /api/public/booking] Updating order:', orderId);

    if (!orderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const { paymentStatus, status, sendSms } = body;

    console.log('📝 Update data:', { paymentStatus, status, sendSms });

    const updateData: any = {};
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (status !== undefined) updateData.status = status;
    if (sendSms !== undefined) updateData.sendSms = sendSms;

    await connectToDatabase();
    
    const booking = await Booking.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true }
    )
    .populate('busId', 'busNumber type capacity departureTime contactNumber')
    .populate('routeId', 'name fromLocation toLocation price pickupLocations');

    if (!booking) {
      console.log('❌ [PUT /api/public/booking] Booking not found for order:', orderId);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Booking not found'
      }, { status: 404 });
    }

    console.log('✅ [PUT /api/public/booking] Booking updated:', booking._id);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ [PUT /api/public/booking] Error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Error updating booking'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';