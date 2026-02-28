import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Bookings';
import Bus from '@/models/Bus';
import Route from '@/models/Route';
import Payment from '@/models/Payment';
import { payhereConfig, generatePayhereHash } from '@/lib/payhere';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Booking ID is required',
      }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId)
      .populate({ path: 'busId', model: Bus })
      .populate({ path: 'routeId', model: Route });

    if (!booking || !booking.busId || !booking.routeId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Booking not found or incomplete',
      }, { status: 404 });
    }

    if (booking.paymentStatus === 'paid') {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Booking already paid',
      }, { status: 400 });
    }

    // Check existing payment
    let payment = await Payment.findOne({ 
      bookingId: booking._id,
      status: 'pending' 
    });
    
    let orderId: string;

    if (payment) {
      orderId = payment.orderId;
    } else {
      const timestamp = Date.now();
      orderId = `BUS${timestamp}`;
      
      
      payment = await Payment.create({
        bookingId: booking._id,
        orderId,
        merchantId: payhereConfig.merchantId,
        amount: booking.totalAmount,
        currency: payhereConfig.currency,
        status: 'pending',
      });

      booking.orderId = orderId;
      booking.paymentId = payment._id.toString();
      await booking.save();
    }

    // Prepare passenger name
    const nameParts = booking.passengerName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    // Format amount
    const amountStr = parseFloat(booking.totalAmount.toString()).toFixed(2);

    // Generate hash
    const hash = generatePayhereHash(
      payhereConfig.merchantId,
      orderId,
      amountStr,
      payhereConfig.currency,
      payhereConfig.merchantSecret
    );

    // Bus type display
    const busTypeMap: { [key: string]: string } = {
      'luxury': 'Luxury',
      'semi_luxury': 'Semi-Luxury',
      'normal': 'Normal'
    };
    const busType = busTypeMap[booking.busId.type] || booking.busId.type;

    // Items description
    const itemsDescription = `${booking.routeId.fromLocation} → ${booking.routeId.toLocation} | ${booking.busId.busNumber} (${busType}) | Seats: ${booking.seatNumbers.join(', ')}`;

    // Return URLs
    const returnUrl = `${payhereConfig.notifyUrl.replace('/api/payments/webhook', '')}/payment/success`;
    const cancelUrl = `${payhereConfig.notifyUrl.replace('/api/payments/webhook', '')}/payment/cancel`;

    // Payment data for PayHere JS SDK
    const paymentData = {
      sandbox: payhereConfig.mode === 'sandbox',
      merchant_id: payhereConfig.merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: payhereConfig.notifyUrl,
      order_id: orderId,
      items: itemsDescription,
      currency: payhereConfig.currency,
      amount: amountStr,
      first_name: firstName,
      last_name: lastName,
      email: booking.passengerEmail || `booking${orderId}@busticket.lk`,
      phone: booking.passengerPhone,
      address: booking.pickupLocation,
      city: booking.routeId.fromLocation,
      country: 'Sri Lanka',
      hash: hash,
      custom_1: booking._id.toString(),
      custom_2: booking.routeId._id.toString(),
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        payment,
        paymentData,
      },
    });
  } catch (error) {
    console.error('❌ Error initializing payment:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: error instanceof Error ? error.message : 'Error initializing payment',
    }, { status: 500 });
  }
}