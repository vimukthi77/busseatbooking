export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'manager';
  isActive: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface IPayment {
  _id: string;
  bookingId?: string;
  orderId: string;
  paymentId?: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  statusCode?: string;
  cardHolderName?: string;
  cardNo?: string;
  paymentData?: any;
  bookingData?: any;
  createdAt: Date;
  updatedAt: Date;
}
export interface IBooking {
  _id: string;
  paymentId?: string;
  userId?: string | IUser;
  orderId: string;
  busId: string | IBus;
  routeId: string | IRoute;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumbers: number[];
  travelDate: Date;
  pickupLocation?: string;
  bookingDate: Date;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  sendSms: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingRequest {
  busId: string;
  routeId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumbers: number[];
  travelDate: string;
  totalAmount: number;
  paymentMethod?: string;
  notes?: string;
}

export interface UpdateBookingRequest {
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  seatNumbers?: number[];
  travelDate?: string;
  status?: 'pending' |'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'failed'| 'refunded';
  notes?: string;
}

export interface BookingFilters {
  routeId?: string;
  busId?: string;
  status?: string;
  paymentStatus?: string;
  travelDate?: string;
  dateFrom?: string;
  dateTo?: string;
}
export interface IRoute {
  _id: string;
  name: string;
  fromLocation: string;
  toLocation: string;
  pickupLocations: string[];
  distance: number;
  duration: number;
  price: number;
  comeSoon: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRouteRequest {
  name: string;
  fromLocation: string;
  toLocation: string;
  pickupLocations: string[];
  distance: number;
  duration: number;
  price: number;
  comeSoon: boolean;
}

export interface UpdateRouteRequest {
  name?: string;
  fromLocation?: string;
  toLocation?: string;
  pickupLocations?: string[];
  distance?: number;
  duration?: number;
  price?: number;
  comeSoon?: boolean;
  isActive?: boolean;
}
export interface IBus {
  _id: string;
  busNumber: string;
  type: 'luxury' | 'semi_luxury' | 'normal';
  capacity: number;
  amenities: string[];
  departureTime: string;
  isActive: boolean;
  routeId?: string | IRoute;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusRequest {
  busNumber: string;
  type: 'luxury' | 'semi_luxury' | 'normal';
  capacity: number;
  amenities: string[];
  departureTime: string;
  routeId: string;
}

export interface UpdateBusRequest {
  busNumber?: string;
  type?: 'luxury' | 'semi_luxury' | 'normal';
  capacity?: number;
  amenities?: string[];
  departureTime?: string;
  routeId?: string;
  isActive?: boolean;
}


export interface IFeedback {
  _id: string;
  name: string;
  mobile: string;
  feedback: string;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeedbackRequest {
  name: string;
  mobile: string;
  feedback: string;
}

export interface UpdateFeedbackRequest {
  status?: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'manager';
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'admin' | 'manager';
  isActive?: boolean;
  password?: string;
}

export interface TwoFactorSetupRequest {
  pin: string;
}

export interface PermissionMap {
  [key: string]: string[];
}

export const PERMISSIONS: PermissionMap = {
  super_admin: ['users:read', 'users:write', 'users:delete', 'routes:read', 'routes:write', 'routes:delete', 'buses:read', 'buses:write', 'buses:delete', 'bookings:read', 'bookings:write', 'bookings:delete', 'analytics:read', 'feedbacks:read','feedbacks:write','feedbacks:delete',],
  admin: ['routes:read', 'routes:write', 'routes:delete', 'buses:read', 'buses:write', 'buses:delete', 'bookings:read', 'bookings:write', 'bookings:delete'],
  manager: ['bookings:read', 'bookings:write', 'bookings:delete', 'routes:read', 'buses:read']
};