import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const token = request.cookies.get('authToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'No token provided'
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password -twoFactorSecret');

    if (!user || !user.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User data retrieved',
      data: { user }
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Invalid token'
    }, { status: 401 });
  }
}