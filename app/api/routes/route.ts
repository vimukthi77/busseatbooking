// app/api/routes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Route from '@/models/Route';
import { verifyToken, hasPermission } from '@/lib/auth';
import { ApiResponse, CreateRouteRequest } from '@/types';

// GET all routes
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const routes = await Route.find().sort({ createdAt: -1 });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Routes fetched successfully',
      data: routes,
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Error fetching routes',
      },
      { status: 500 }
    );
  }
}

// POST create route
export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get('authToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!hasPermission(decoded.role, 'routes:write')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Forbidden',
        },
        { status: 403 }
      );
    }

    const body: CreateRouteRequest = await request.json();
    
    console.log('Received route data:', body); // Debug log

    await connectToDatabase();

    // Explicitly set the comeSoon value
    const routeData = {
      name: body.name,
      fromLocation: body.fromLocation,
      toLocation: body.toLocation,
      pickupLocations: body.pickupLocations || [],
      distance: body.distance,
      duration: body.duration,
      price: body.price,
      comeSoon: body.comeSoon === true, // Explicit boolean conversion
    };

    console.log('Creating route with data:', routeData); // Debug log

    const route = await Route.create(routeData);

    console.log('Created route:', route); // Debug log

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Route created successfully',
        data: route,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Error creating route',
      },
      { status: 500 }
    );
  }
}