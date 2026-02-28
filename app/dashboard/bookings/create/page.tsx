'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Bus,
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  Plus,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { IRoute, IBus } from '@/types';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

interface BookingFormData {
  routeId: string;
  busId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  seatNumbers: number[];
  travelDate: string;
  passengers: number;
  pickupLocation: string;
}

export default function AdminCreateBookingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, hasPermission } = useAuth();

  const [routes, setRoutes] = useState<IRoute[]>([]);
  const [buses, setBuses] = useState<IBus[]>([]);
  const [availableSeats, setAvailableSeats] = useState<number[]>([]);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [seatLoading, setSeatLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const [formData, setFormData] = useState<BookingFormData>({
    routeId: '',
    busId: '',
    passengerName: '',
    passengerPhone: '',
    passengerEmail: '',
    seatNumbers: [],
    travelDate: '',
    passengers: 1,
    pickupLocation: ''
  });

  const [selectedRoute, setSelectedRoute] = useState<IRoute | null>(null);
  const [selectedBus, setSelectedBus] = useState<IBus | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Helper Functions
  const isBusLocked = (bus: any, travelDate: string) => {
    if (!travelDate || !bus || !bus.departureTime) return false;

    try {
      const selectedDate = new Date(travelDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate.getTime() !== today.getTime()) {
        return false;
      }

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [hours, minutes] = bus.departureTime.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        return false;
      }

      const departureTimeInMinutes = hours * 60 + minutes;
      const timeDifference = departureTimeInMinutes - currentTime;

      return timeDifference < 30 && timeDifference >= 0;
    } catch (error) {
      console.error('Error checking bus lock status:', error);
      return false;
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return 'Not set';

    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);

      if (isNaN(hour)) {
        return 'Not set';
      }

      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Not set';
    }
  };

  // UseEffect Hooks
  useEffect(() => {
    if (hasPermission('bookings:write')) {
      fetchRoutes();
    } else {
      router.push('/dashboard');
    }
  }, [hasPermission]);

  useEffect(() => {
    if (formData.routeId) {
      fetchBusesByRoute(formData.routeId);
    }
  }, [formData.routeId]);

  useEffect(() => {
    if (formData.busId && formData.travelDate) {
      fetchAvailableSeats();
    }
  }, [formData.busId, formData.travelDate]);

  // API Functions
  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes');
      const data = await response.json();
      if (data.success) {
        setRoutes(data.data.filter((route: IRoute) => route.isActive));
      }
    } catch (error) {
      toast.error('Failed to fetch routes');
    }
  };

  const fetchBusesByRoute = async (routeId: string) => {
    try {
      const response = await fetch(`/api/public/buses?routeId=${routeId}`);
      const data = await response.json();

      if (data.success) {
        setBuses(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch buses');
        setBuses([]);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      toast.error('Failed to fetch buses');
      setBuses([]);
    }
  };

  const fetchAvailableSeats = async () => {
    setSeatLoading(true);
    try {
      const response = await fetch(
        `/api/public/available-seats?busId=${formData.busId}&travelDate=${formData.travelDate}`
      );
      const data = await response.json();
      if (data.success) {
        setAvailableSeats(data.data.availableSeats);
        setBookedSeats(data.data.bookedSeats);
      }
    } catch (error) {
      toast.error('Failed to fetch available seats');
    } finally {
      setSeatLoading(false);
    }
  };

  // Handler Functions
  const handleRouteChange = (routeId: string) => {
    const route = routes.find(r => r._id === routeId);
    setSelectedRoute(route || null);
    setFormData(prev => ({
      ...prev,
      routeId,
      busId: '',
      seatNumbers: [],
      pickupLocation: ''
    }));
    setSelectedBus(null);
    setAvailableSeats([]);
    setBookedSeats([]);
  };

  const handleBusChange = (busId: string) => {
    const bus = buses.find(b => b._id === busId);
    setSelectedBus(bus || null);
    setFormData(prev => ({
      ...prev,
      busId,
      seatNumbers: []
      // pickupLocation is intentionally not reset here
    }));
  };

  const toggleSeatSelection = (seatNumber: number) => {
    const isSelected = formData.seatNumbers.includes(seatNumber);

    if (isSelected) {
      setFormData({
        ...formData,
        seatNumbers: formData.seatNumbers.filter(seat => seat !== seatNumber)
      });
    } else {
      if (formData.seatNumbers.length < formData.passengers) {
        setFormData({
          ...formData,
          seatNumbers: [...formData.seatNumbers, seatNumber].sort((a, b) => a - b)
        });
      } else {
        toast.error(`Only select ${formData.passengers} seat${formData.passengers === 1 ? '' : 's'}`);
      }
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.routeId) errors.push('Please select a route');
    if (!formData.busId) errors.push('Please select a bus');
    if (!formData.travelDate) errors.push('Please select a travel date');
    if (!formData.pickupLocation) errors.push('Please select a pickup location');
    if (formData.seatNumbers.length !== formData.passengers) {
      errors.push(`Please select exactly ${formData.passengers} seat${formData.passengers === 1 ? '' : 's'}`);
    }
    if (!formData.passengerName.trim()) errors.push('Please enter passenger name');
    if (!formData.passengerPhone.trim()) errors.push('Please enter passenger phone number');

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors');
      return;
    }

    setValidationErrors([]);
    setLoading(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          totalAmount: getTotalAmount(),
          status: 'pending',
          paymentStatus: 'pending'
        })
      });

      const data = await response.json();
      if (data.success) {
        const bookingId = data.data._id;
        setBookingId(bookingId);

        // Send SMS notification
        try {
          await sendSMSNotification(data.data);
          toast.success('Booking created successfully with SMS sent');
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          toast.warning('Booking created but SMS notification failed');
        }

        setBookingSuccess(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const sendSMSNotification = async (booking: any) => {
    // Format bus departure time to 12-hour format
    const formatDepartureTime = (time: string) => {
      if (!time) return 'Not Set';
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    // Format date as YYYY-MM-DD
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
    };

    const message = `Hi ${booking.passengerName},

Welcome to Bus Seat Booking!

Transaction ID: ${booking._id.slice(-8).toUpperCase()}
Journey Date: ${formatDate(booking.travelDate)}
Seats: ${booking.seatNumbers.join(',')}
Pick-Up Location: ${booking.pickupLocation}
Drop-Off Location: ${booking.routeId?.toLocation || booking.routeId?.name}
Bus No: ${booking.busId?.busNumber}
Bus Departure Time: ${formatDepartureTime(booking.busId?.departureTime)}
Bus Hotline No: ${booking.busId?.contactNumber || '+94725787878'}

Each seat is allowed with 1 bag and 1 luggage.

Please arrive at the bus stop 15 minutes before the bus departure.

For Online Seat Reservation: busseatbooking.com
For inquiries: +94724151515

Thank you and have a safe journey!`;

    const smsResponse = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: booking.passengerPhone,
        message: message,
      })
    });

    const smsData = await smsResponse.json();
    if (!smsData.success) {
      throw new Error(smsData.message || 'Failed to send SMS');
    }
  };

  const getTotalAmount = () => {
    if (selectedRoute && formData.seatNumbers.length > 0) {
      return selectedRoute.price * formData.seatNumbers.length;
    }
    return 0;
  };

  const handleBackClick = () => {
    router.push('/dashboard/bookings');
  };

  const renderSeatLayout = () => {
  if (!selectedBus) return null;

  // Define the seat layout based on the correct pattern from app/booking
  const leftColumnRows = [
    [4, 3],
    [8, 7],
      [12, 11],
    [16, 15],
  [20, 19],
  [24, 23],
  [28, 27],
  [32, 31],
  [36, 35],
  [40, 39],
  [44, 43],
    ];

  const rightColumnRows = [
  [2, 1],
      [6, 5],
  [10, 9],
  [14, 13],
  [18, 17],
  [22, 21],
  [26, 25],
  [30, 29],
  [34, 33],
  [38, 37],
      [42, 41],
  ];

  const backRowSeats = [49, 48, 47, 46, 45];

  // Helper component for a single seat
  const SeatButton = ({ seatNumber }: { seatNumber: number }) => {
  const isAvailable = availableSeats.includes(seatNumber);
  const isSelected = formData.seatNumbers.includes(seatNumber);
  const isBooked = bookedSeats.includes(seatNumber);

  return (
  <button
  key={seatNumber}
  type="button"
  disabled={!isAvailable || isBooked}
  onClick={() => toggleSeatSelection(seatNumber)}
  className={`
  w-12 h-12 rounded-lg border-2 text-sm font-medium transition-all
  ${isSelected
  ? 'bg-sky-500 text-white border-sky-500 scale-105 shadow-lg'
  : isBooked
  ? 'bg-red-100 border-red-300 cursor-not-allowed text-red-400'
  : 'bg-white border-gray-300 hover:border-sky-400 hover:bg-sky-50 text-gray-700'
  }
  `}
  >
  {/* Format number to be two digits (e.g., 1 -> 01) */}
          {seatNumber.toString().padStart(2, '0')}
  </button>
  );
  };

  return (
  <div className="space-y-4">
  {/* Bus Front */}
  <div className="text-center mb-4">
  <div className="inline-flex items-center gap-4 px-6 py-2 rounded-t-lg bg-gray-100">
  <span className="text-lg">🚪</span>
  <span className="text-sm font-medium text-gray-600">Entrance</span>
  <span className="text-lg">🚍</span>
  <span className="text-sm font-medium text-gray-600">Bus Front</span>
  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
  </div>
  <span className="text-sm font-medium text-gray-600">Driver</span>
  </div>
  </div>

  <div className="p-6 rounded-lg border-2 bg-gray-50 border-gray-300">
  {/* Main Seats Layout */}
          <div className="flex justify-between">
    {/* Left Column */}
    <div className="space-y-3">
    {leftColumnRows.map((row, rowIndex) => (
    <div key={rowIndex} className="flex gap-2">
    <SeatButton seatNumber={row[0]} />
  <SeatButton seatNumber={row[1]} />
  </div>
  ))}
  </div>

  {/* Right Column */}
  <div className="space-y-3">
  {rightColumnRows.map((row, rowIndex) => (
  <div key={rowIndex} className="flex gap-2">
  <SeatButton seatNumber={row[0]} />
  <SeatButton seatNumber={row[1]} />
  </div>
  ))}
  </div>
  </div>

  {/* Back seats */}
  <div className="flex justify-center mt-6 pt-4 border-t-2 border-gray-300">
  <div className="flex gap-2">
  {backRowSeats.map((seatNumber) => (
  <SeatButton key={seatNumber} seatNumber={seatNumber} />
  ))}
  </div>
  </div>
  </div>

  {/* Legend */}
  <div className="flex flex-wrap justify-center gap-6 pt-4">
          <div className="flex items-center gap-2">
    <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
  <span className="text-sm text-gray-700">Available</span>
  </div>
  <div className="flex items-center gap-2">
  <div className="w-6 h-6 bg-sky-500 border-2 border-sky-500 rounded"></div>
  <span className="text-sm text-gray-700">Selected</span>
  </div>
  <div className="flex items-center gap-2">
  <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
  <span className="text-sm text-gray-700">Booked</span>
  </div>
  </div>
  </div>
  );
  };

  if (bookingSuccess) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card>
              <CardContent className="text-center p-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Created Successfully!</h2>
                <p className="text-gray-600 mb-4">
                  Booking ID: <span className="font-mono font-bold">#{bookingId.slice(-6).toUpperCase()}</span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  The booking has been created with pending status and payment status. SMS notification has been sent to the passenger.
                </p>
                <div className="space-y-3">
                  <Button onClick={() => router.push('/dashboard/bookings')} className="w-full">
                    View All Bookings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBookingSuccess(false);
                      setBookingId('');
                      setFormData({
                        routeId: '',
                        busId: '',
                        passengerName: '',
                        passengerPhone: '',
                        passengerEmail: '',
                        seatNumbers: [],
                        travelDate: '',
                        passengers: 1,
                        pickupLocation: ''
                      });
                      setSelectedRoute(null);
                      setSelectedBus(null);
                    }}
                    className="w-full"
                  >
                    Create Another Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Create New Booking</h1>
              <p className="text-gray-600">Create a booking manually for admin purposes</p>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">Please fix the following errors:</h3>
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Select Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label>Route *</Label>
                  <Select value={formData.routeId} onValueChange={handleRouteChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route._id} value={route._id}>
                          {route.fromLocation} → {route.toLocation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bus and Travel Details */}
            {selectedRoute && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="w-5 h-5" />
                    Bus and Travel Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label>Travel Date *</Label>
                      <Input
                        type="date"
                        value={formData.travelDate}
                        onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Number of Passengers *</Label>
                      <Select
                        value={formData.passengers.toString()}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          passengers: parseInt(value),
                          seatNumbers: []
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Passenger' : 'Passengers'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Pickup Location *</Label>
                      <Select
                        value={formData.pickupLocation}
                        onValueChange={(value) => setFormData({ ...formData, pickupLocation: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pickup location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={selectedRoute.fromLocation}>
                            {selectedRoute.fromLocation} (Starting Point)
                          </SelectItem>
                          {selectedRoute.pickupLocations.map((location, idx) => (
                            <SelectItem key={idx} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Available Buses */}
                  {buses.length > 0 && (
                    <div className="space-y-3">
                      <Label>Select Bus *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {buses.map((bus) => {
                          const locked = isBusLocked(bus, formData.travelDate);

                          return (
                            <Card
                              key={bus._id}
                              className={`cursor-pointer transition-all ${
                                formData.busId === bus._id
                                  ? 'ring-2 ring-sky-500 shadow-lg'
                                  : 'hover:shadow-md'
                              } ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                              onClick={() => {
                                if (!locked) {
                                  handleBusChange(bus._id);
                                } else {
                                  toast.error('This bus is departing soon and cannot be booked');
                                }
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-sky-100">
                                      <Bus className="w-5 h-5 text-sky-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">{bus.busNumber}</h4>
                                      <Badge variant={bus.type === 'luxury' ? 'default' : 'secondary'} className="text-xs">
                                        {bus.type.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                  {formData.busId === bus._id && (
                                    <CheckCircle className="w-5 h-5 text-sky-500" />
                                  )}
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(bus.departureTime)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{bus.capacity} seats</span>
                                  </div>
                                </div>
                                {locked && (
                                  <Badge variant="destructive" className="mt-2 text-xs">
                                    Departing Soon
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Seat Selection */}
            {selectedBus && formData.travelDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Select Seats ({formData.seatNumbers.length}/{formData.passengers})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {seatLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                    </div>
                  ) : (
                    renderSeatLayout()
                  )}
                </CardContent>
              </Card>
            )}

            {/* Passenger Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Passenger Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.passengerName}
                      onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                      placeholder="Enter passenger full name"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Phone Number *</Label>
                    <Input
                      value={formData.passengerPhone}
                      onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Email (Optional)</Label>
                  <Input
                    type="email"
                    value={formData.passengerEmail}
                    onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            {selectedRoute && selectedBus && formData.seatNumbers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Route</p>
                      <p className="font-medium">{selectedRoute.fromLocation} → {selectedRoute.toLocation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bus</p>
                      <p className="font-medium">{selectedBus.busNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Travel Date</p>
                      <p className="font-medium">{formData.travelDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pickup Location</p>
                      <p className="font-medium">{formData.pickupLocation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Seats</p>
                      <p className="font-medium">{formData.seatNumbers.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Passenger</p>
                      <p className="font-medium">{formData.passengerName}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-2xl font-bold text-sky-600">
                        LKR {getTotalAmount().toLocaleString()}/=
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.seatNumbers.length} × LKR {selectedRoute.price}/=
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">Admin Booking Notes:</p>
                        <ul className="space-y-1">
                          <li>• Booking will be created with "Pending" status</li>
                          <li>• Payment status will be set to "Pending"</li>
                          <li>• SMS notification will be sent to the passenger</li>
                          <li>• Payment process is bypassed for admin bookings</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Booking
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
