import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Bookings';
import Payment from '@/models/Payment';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    await connectToDatabase();

    // Find the payment record
    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      console.error('❌ Payment record not found:', orderId);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Payment record not found'
      }, { status: 404 });
    }

    if (payment.status !== 'completed') {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Payment not completed'
      }, { status: 400 });
    }

    if (!payment.bookingData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'No booking data found in payment record'
      }, { status: 400 });
    }

    // Check if booking already exists
    const existingBooking = await Booking.findOne({ orderId });

    if (existingBooking) {
      console.log('ℹ️ Booking already exists:', existingBooking._id);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Booking already exists',
        data: existingBooking
      });
    }

    // Check seat availability
    const travelDate = new Date(payment.bookingData.travelDate);
    const startOfDay = new Date(travelDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(travelDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      busId: payment.bookingData.busId,
      travelDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    const bookedSeats = existingBookings.reduce((acc, booking) => {
      return [...acc, ...booking.seatNumbers];
    }, [] as number[]);

    const conflictingSeats = payment.bookingData.seatNumbers.filter((seat: number) =>
      bookedSeats.includes(seat)
    );

    if (conflictingSeats.length > 0) {
      console.error('❌ Seats no longer available:', conflictingSeats);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `Seats ${conflictingSeats.join(', ')} are no longer available`
      }, { status: 400 });
    }

    // Create the booking
    const booking = await Booking.create({
      userId: '000000000000000000000000',
      busId: payment.bookingData.busId,
      routeId: payment.bookingData.routeId,
      passengerName: payment.bookingData.passengerName,
      passengerPhone: payment.bookingData.passengerPhone,
      passengerEmail: payment.bookingData.passengerEmail || '',
      pickupLocation: payment.bookingData.pickupLocation,
      seatNumbers: payment.bookingData.seatNumbers,
      travelDate: payment.bookingData.travelDate,
      totalAmount: payment.bookingData.totalAmount,
      bookingDate: new Date(),
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: payment.paymentMethod || 'online',
      orderId: orderId,
      paymentId: payment._id.toString(),
      notes: payment.bookingData.notes || '',
      sendSms: false, // Will be set to true after SMS is sent
      paymentDetails: {
        orderId: orderId,
        amount: payment.amount,
        currency: payment.currency,
        statusCode: payment.statusCode,
        statusMessage: payment.statusMessage,
        method: payment.paymentMethod,
        cardHolderName: payment.cardHolderName,
        cardNo: payment.cardNo,
        paidAt: payment.updatedAt || new Date(),
      }
    });

    // Update payment with booking ID
    payment.bookingId = booking._id.toString();
    await payment.save();

    console.log('✅ Booking created successfully:', booking._id);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('❌ Error creating booking from payment:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Error creating booking'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
