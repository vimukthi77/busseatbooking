import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Bookings';
import Payment from '@/models/Payment';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 PayHere Webhook Received:', {
      order_id: body.order_id,
      status_code: body.status_code,
      amount: body.payhere_amount
    });

    await connectToDatabase();

    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1,
      method,
      status_message,
      card_holder_name,
      card_no,
    } = body;

    // Verify the signature
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;
    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    const localMd5sig = crypto
      .createHash('md5')
      .update(
        merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        hashedSecret
      )
      .digest('hex')
      .toUpperCase();

    if (localMd5sig !== md5sig) {
      console.error('❌ Invalid signature');
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('✅ Signature verified');

    // Find the payment record
    let payment = await Payment.findOne({ orderId: order_id });

    if (!payment) {
      console.error('❌ Payment record not found:', order_id);
      return NextResponse.json(
        { success: false, message: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Update payment status
    payment.status = status_code === '2' ? 'completed' : 'failed';
    payment.statusCode = status_code;
    payment.paymentMethod = method;
    payment.cardHolderName = card_holder_name;
    payment.cardNo = card_no;

    // 🔴 CRITICAL: Only create booking if payment is successful (status_code === '2')
    if (status_code === '2') {
      console.log('✅ Payment successful, creating booking...');

      if (!payment.bookingData) {
        console.error('❌ No booking data found in payment record');
        await payment.save();
        return NextResponse.json(
          { success: false, message: 'No booking data found' },
          { status: 400 }
        );
      }

      // Check if booking already exists (prevent duplicate bookings)
      const existingBooking = await Booking.findOne({ orderId: order_id });
      
      if (existingBooking) {
        console.log('ℹ️ Booking already exists:', existingBooking._id);
        payment.bookingId = existingBooking._id.toString();
        await payment.save();
        
        return NextResponse.json({ success: true, message: 'Booking already processed' });
      }

      // Check seat availability one more time before creating booking
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
        payment.status = 'failed';
        payment.statusCode = 'SEATS_UNAVAILABLE';
        await payment.save();

        return NextResponse.json(
          { success: false, message: `Seats ${conflictingSeats.join(', ')} are no longer available` },
          { status: 400 }
        );
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
        paymentMethod: method || 'online',
        orderId: order_id,
        paymentId: payment._id.toString(),
        notes: payment.bookingData.notes || '',
        sendSms: false, // Will be set to true after SMS is sent
        paymentDetails: {
          orderId: order_id,
          amount: parseFloat(payhere_amount),
          currency: payhere_currency,
          statusCode: status_code,
          statusMessage: status_message,
          method: method,
          cardHolderName: card_holder_name,
          cardNo: card_no,
          paidAt: new Date(),
        }
      });

      // Update payment with booking ID
      payment.bookingId = booking._id.toString();
      await payment.save();

      console.log('✅ Booking created successfully:', booking._id);

    } else {
      console.log('❌ Payment failed or cancelled (status_code:', status_code, ')');
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';