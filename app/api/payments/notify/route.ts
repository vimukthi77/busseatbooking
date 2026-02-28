import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Bookings';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const merchant_id = formData.get('merchant_id') as string;
    const order_id = formData.get('order_id') as string;
    const payment_id = formData.get('payment_id') as string;
    const payhere_amount = formData.get('payhere_amount') as string;
    const payhere_currency = formData.get('payhere_currency') as string;
    const status_code = formData.get('status_code') as string;
    const md5sig = formData.get('md5sig') as string;
    const custom_1 = formData.get('custom_1') as string; // booking ID
    
    console.log('📨 Payment notification received:', {
      merchant_id,
      order_id,
      payment_id,
      status_code,
      bookingId: custom_1
    });

    // Verify hash
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET!;
    const local_md5sig = crypto
      .createHash('md5')
      .update(
        merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase()
      )
      .digest('hex')
      .toUpperCase();

    if (local_md5sig !== md5sig) {
      console.error('❌ Hash verification failed');
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400 });
    }

    console.log('✅ Hash verified successfully');

    await connectToDatabase();

    // Update booking based on payment status
    if (status_code === '2') {
      // Payment successful
      await Booking.findByIdAndUpdate(custom_1, {
        paymentStatus: 'paid',
        status: 'completed', // Changed from 'confirmed' to 'completed'
        paymentId: payment_id,
        paymentDate: new Date()
      });

      console.log('✅ Booking updated to COMPLETED and PAID');
    } else if (status_code === '0') {
      // Payment pending
      await Booking.findByIdAndUpdate(custom_1, {
        paymentStatus: 'pending',
        status: 'pending'
      });

      console.log('⏳ Booking status: PENDING');
    } else if (status_code === '-1') {
      // Payment canceled
      await Booking.findByIdAndUpdate(custom_1, {
        paymentStatus: 'failed',
        status: 'cancelled'
      });

      console.log('❌ Booking CANCELLED');
    } else if (status_code === '-2') {
      // Payment failed
      await Booking.findByIdAndUpdate(custom_1, {
        paymentStatus: 'failed',
        status: 'cancelled'
      });

      console.log('❌ Payment FAILED - Booking cancelled');
    } else if (status_code === '-3') {
      // Payment chargedback
      await Booking.findByIdAndUpdate(custom_1, {
        paymentStatus: 'refunded',
        status: 'cancelled'
      });

      console.log('🔄 Payment CHARGEDBACK - Booking cancelled');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error processing payment notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}