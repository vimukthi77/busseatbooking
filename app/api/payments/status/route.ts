import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Payment not found'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Payment status retrieved successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Error fetching payment status'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const updateData = body;

    const payment = await Payment.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true }
    );

    if (!payment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Payment not found'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Error updating payment'
    }, { status: 500 });
  }
}
