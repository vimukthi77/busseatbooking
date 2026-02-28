// app/api/routes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Route from '@/models/Route';
import Bus from '@/models/Bus';
import { verifyToken, hasPermission } from '@/lib/auth';
import { ApiResponse, UpdateRouteRequest } from '@/types';

// GET single route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    if (!hasPermission(decoded.role, 'routes:read')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Forbidden',
        },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const route = await Route.findById(id);

    if (!route) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Route not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Route fetched successfully',
      data: route,
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Error fetching route',
      },
      { status: 500 }
    );
  }
}

// PUT update route
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body: UpdateRouteRequest = await request.json();
    
    console.log('Received update data:', body); // Debug log

    await connectToDatabase();

    // Explicitly handle the comeSoon field
    const updateData: any = {
      ...(body.name && { name: body.name }),
      ...(body.fromLocation && { fromLocation: body.fromLocation }),
      ...(body.toLocation && { toLocation: body.toLocation }),
      ...(body.pickupLocations !== undefined && { pickupLocations: body.pickupLocations }),
      ...(body.distance !== undefined && { distance: body.distance }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    };

    // Explicitly set comeSoon
    if (body.comeSoon !== undefined) {
      updateData.comeSoon = body.comeSoon === true;
    }

    console.log('Update data to be saved:', updateData); // Debug log

    const route = await Route.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!route) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Route not found',
        },
        { status: 404 }
      );
    }

    console.log('Updated route:', route); // Debug log

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Route updated successfully',
      data: route,
    });
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Error updating route',
      },
      { status: 500 }
    );
  }
}

// DELETE route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    if (!hasPermission(decoded.role, 'routes:delete')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Forbidden',
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Check if any buses are using this route
    const busesUsingRoute = await Bus.countDocuments({ routeId: id });
    if (busesUsingRoute > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `Cannot delete route. ${busesUsingRoute} buses are using this route.`,
        },
        { status: 400 }
      );
    }

    const route = await Route.findByIdAndDelete(id);

    if (!route) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Route not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Route deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Error deleting route',
      },
      { status: 500 }
    );
  }
}