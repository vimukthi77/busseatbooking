import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Booking from '@/models/Bookings';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Order ID is required',
      }, { status: 400 });
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Payment not found',
      }, { status: 404 });
    }

    const booking = await Booking.findById(payment.bookingId)
      .populate('busId')
      .populate('routeId');

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Error verifying payment',
    }, { status: 500 });
  }
}