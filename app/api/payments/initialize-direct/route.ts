import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Bus from '@/models/Bus';
import Route from '@/models/Route';
import { payhereConfig, generatePayhereHash } from '@/lib/payhere';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const { bookingData } = body;

    if (!bookingData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Booking data is required',
      }, { status: 400 });
    }

    // Validate required fields
    if (!bookingData.busId || !bookingData.routeId || !bookingData.passengerName ||
        !bookingData.passengerPhone || !bookingData.seatNumbers || !bookingData.travelDate ||
        !bookingData.pickupLocation) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Get bus and route details for validation
    const [bus, route] = await Promise.all([
      Bus.findById(bookingData.busId),
      Route.findById(bookingData.routeId)
    ]);

    if (!bus || !route) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid bus or route'
      }, { status: 404 });
    }

    // Generate unique order ID
    const timestamp = Date.now();
    const orderId = `BUS${timestamp}`;

    // Create payment record with booking data (NO BOOKING YET)
    const payment = await Payment.create({
      orderId,
      merchantId: payhereConfig.merchantId,
      amount: bookingData.totalAmount,
      currency: payhereConfig.currency,
      status: 'pending',
      // Store booking data for later use in webhook
      bookingData: bookingData
    });

    console.log('✅ Payment record created:', orderId);

    // Prepare passenger name
    const nameParts = bookingData.passengerName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    // Format amount
    const amountStr = parseFloat(bookingData.totalAmount.toString()).toFixed(2);

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
    const busType = busTypeMap[bus.type] || bus.type;

    // Items description
    const itemsDescription = `${route.fromLocation} → ${route.toLocation} | ${bus.busNumber} (${busType}) | Seats: ${bookingData.seatNumbers.join(', ')}`;

    // Return URLs
    const returnUrl = `${payhereConfig.appUrl}/payment/success?order_id=${orderId}`;
    const cancelUrl = `${payhereConfig.appUrl}/payment/cancel?order_id=${orderId}`;

    // Payment data for PayHere JS SDK
    const paymentData = {
      sandbox: false, // 🔴 CHANGE TO false FOR PRODUCTION
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
      email: bookingData.passengerEmail || `booking${orderId}@busticket.lk`,
      phone: bookingData.passengerPhone,
      address: bookingData.pickupLocation,
      city: route.fromLocation,
      country: 'Sri Lanka',
      hash: hash,
      custom_1: payment._id.toString(),
      custom_2: route._id.toString(),
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        payment,
        paymentData,
        orderId: orderId
      },
    });
  } catch (error) {
    console.error('❌ Error initializing direct payment:', error);

    return NextResponse.json<ApiResponse>({
      success: false,
      message: error instanceof Error ? error.message : 'Error initializing payment',
    }, { status: 500 });
  }
}