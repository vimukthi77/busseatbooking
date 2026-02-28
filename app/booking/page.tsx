'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Bus,
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
  Mail,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Plus,
  Search,
  MousePointerClick,
  CreditCard,
  Info,
  Calendar,
  Lock,
  HelpCircle,
  X,
  Shield
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { IRoute, IBus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import PayhereCheckoutInline from '@/components/PayhereCheckoutInline';

const BOOKING_FEE = 100; // LKR - Fixed per booking

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

export default function BookTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [routes, setRoutes] = useState<IRoute[]>([]);
  const [buses, setBuses] = useState<IBus[]>([]);
  const [availableSeats, setAvailableSeats] = useState<number[]>([]);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [seatLoading, setSeatLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Payment related states
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string>('');

  // Location filter states
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [availableFromLocations, setAvailableFromLocations] = useState<string[]>([]);
  const [availableToLocations, setAvailableToLocations] = useState<string[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<IRoute[]>([]);

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

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

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

      return timeDifference <= 60;
    } catch (error) {
      console.error('Error checking bus lock status:', error);
      return false;
    }
  };

  const getTimeToDeparture = (bus: any, travelDate: string) => {
    if (!travelDate || !bus || !bus.departureTime) return null;

    try {
      const selectedDate = new Date(travelDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate.getTime() !== today.getTime()) {
        return null;
      }

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [hours, minutes] = bus.departureTime.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }

      const departureTimeInMinutes = hours * 60 + minutes;
      const timeDifference = departureTimeInMinutes - currentTime;

      if (timeDifference < 60 && timeDifference >= 0) {
        return `${t('booking.departsIn')} ${timeDifference} ${t('booking.min')}`;
      }

      return null;
    } catch (error) {
      console.error('Error getting time to departure:', error);
      return null;
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return t('booking.notSet');

    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);

      if (isNaN(hour)) {
        return t('booking.notSet');
      }

      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return t('booking.notSet');
    }
  };

  const getRouteCardBackground = (route: IRoute) => {
    const fromLocation = route.fromLocation.toLowerCase();
    const toLocation = route.toLocation.toLowerCase();

    if (fromLocation.includes('kaduruwela') || toLocation.includes('kaduruwela')) {
      return '/kaduruwela.webp';
    }
    if (fromLocation.includes('trincomalee') || toLocation.includes('trincomalee')) {
      return '/trincomalee.webp';
    }
    if (fromLocation.includes('kurunagala') || toLocation.includes('kurunagala')) {
      return '/kurunagala.jpg';
    }
    if (fromLocation.includes('anuradhapura') || toLocation.includes('anuradhapura')) {
      return '/anuradhapura.jpg';
    }
    if (fromLocation.includes('vavuniya') || toLocation.includes('vavuniya')) {
      return '/jaffna.webp';
    }
    return null;
  };

  const getBackgroundImage = () => {
    if (currentStep === 1 || !selectedRoute) return null;
    const fromLocation = selectedRoute.fromLocation.toLowerCase();
    const toLocation = selectedRoute.toLocation.toLowerCase();

    if (fromLocation.includes('kaduruwela') || toLocation.includes('kaduruwela')) {
      return '/kaduruwela.webp';
    }
    if (fromLocation.includes('trincomalee') || toLocation.includes('trincomalee')) {
      return '/trincomalee.webp';
    }
    if (fromLocation.includes('kurunagala') || toLocation.includes('kurunagala')) {
      return '/kurunagala.jpg';
    }
    if (fromLocation.includes('anuradhapura') || toLocation.includes('anuradhapura')) {
      return '/anuradhapura.jpg';
    }
    if (fromLocation.includes('jaffna') || toLocation.includes('jaffna')) {
      return '/jaffna.jpg';
    }

    return null;
  };

  const backgroundImage = getBackgroundImage();

  const extractLocations = (routesList: IRoute[]) => {
    const fromLocs = new Set<string>();
    const toLocs = new Set<string>();

    routesList.forEach(route => {
      fromLocs.add(route.fromLocation);
      toLocs.add(route.toLocation);
    });

    setAvailableFromLocations(Array.from(fromLocs).sort());
    setAvailableToLocations(Array.from(toLocs).sort());
  };

  const sortedAndGroupedRoutes = useMemo(() => {
    let filtered = routes;

    if (fromLocation) {
      filtered = filtered.filter(route => route.fromLocation === fromLocation);
    }

    if (toLocation) {
      filtered = filtered.filter(route => route.toLocation === toLocation);
    }

    const availableRoutes = filtered.filter(route => !route.comeSoon);
    const comingSoonRoutes = filtered.filter(route => route.comeSoon);

    const routePairs: { [key: string]: IRoute[] } = {};
    const processed = new Set<string>();

    availableRoutes.forEach(route => {
      if (processed.has(route._id)) return;

      const pairKey = [route.fromLocation, route.toLocation].sort().join('-');

      if (!routePairs[pairKey]) {
        routePairs[pairKey] = [];
      }

      routePairs[pairKey].push(route);

      const reciprocal = availableRoutes.find(r =>
        r._id !== route._id &&
        r.fromLocation === route.toLocation &&
        r.toLocation === route.fromLocation &&
        !processed.has(r._id)
      );

      if (reciprocal) {
        routePairs[pairKey].push(reciprocal);
        processed.add(reciprocal._id);
      }

      processed.add(route._id);
    });

    const groupedAvailable = Object.values(routePairs).flat();

    return [...groupedAvailable, ...comingSoonRoutes];
  }, [fromLocation, toLocation, routes]);

  useEffect(() => {
    setFilteredRoutes(sortedAndGroupedRoutes);
  }, [sortedAndGroupedRoutes]);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    const routeId = searchParams.get('routeId');

    if (routeId && routes.length > 0 && !selectedRoute) {
      const preSelectedRoute = routes.find(r => r._id === routeId);

      if (preSelectedRoute) {
        if (preSelectedRoute.comeSoon) {
          toast.error(t('booking.routeComingSoon'));
          router.replace('/booking');
          return;
        }

        setSelectedRoute(preSelectedRoute);
        setFormData(prev => ({
          ...prev,
          routeId: routeId,
          busId: '',
          seatNumbers: [],
          pickupLocation: ''
        }));

        setCurrentStep(2);

        toast.success(`${t('booking.routeSelected')}: ${preSelectedRoute.fromLocation} → ${preSelectedRoute.toLocation}`);
      }
    }
  }, [searchParams, routes, selectedRoute, t]);

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

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes');
      const data = await response.json();
      if (data.success) {
        const activeRoutes = data.data.filter((route: IRoute) => route.isActive);
        setRoutes(activeRoutes);
        extractLocations(activeRoutes);
      }
    } catch (error) {
      toast.error(t('booking.failedFetchRoutes'));
    }
  };

  const fetchBusesByRoute = async (routeId: string) => {
    try {
      const response = await fetch(`/api/public/buses?routeId=${routeId}`);
      const data = await response.json();

      if (data.success) {
        setBuses(data.data);
      } else {
        toast.error(data.message || t('booking.failedFetchBuses'));
        setBuses([]);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      toast.error(t('booking.failedFetchBuses'));
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
      toast.error(t('booking.failedFetchSeats'));
    } finally {
      setSeatLoading(false);
    }
  };

  const handleRouteSelect = (route: IRoute) => {
    if (route.comeSoon) {
      toast.error(t('booking.routeComingSoon'), {
        description: t('booking.routeComingSoonDesc'),
        duration: 4000,
      });
      return;
    }

    setSelectedRoute(route);
    setFormData({ ...formData, routeId: route._id, busId: '', seatNumbers: [], pickupLocation: '' });
    setCurrentStep(2);
  };

  const handleBusAndDateSelect = () => {
    if (formData.busId && formData.travelDate && formData.passengers && formData.pickupLocation) {
      const bus = buses.find(b => b._id === formData.busId);
      setSelectedBus(bus || null);
    } else {
      toast.error(t('booking.fillAllFields'));
    }
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
        toast.error(`${t('booking.onlySelect')} ${formData.passengers} ${formData.passengers === 1 ? t('booking.seat') : t('booking.seats')}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Store booking data temporarily for payment process
      const bookingData = {
        ...formData,
        selectedRoute,
        selectedBus,
        totalAmount: getTotalAmount()
      };

      // Store in sessionStorage for payment process
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));

      toast.success('Preparing payment...');

      // Step 1: Initialize payment without creating booking
      const paymentResponse = await fetch('/api/payments/initialize-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingData }),
      });

      const paymentDataResponse = await paymentResponse.json();

      if (paymentDataResponse.success) {
        setPaymentData(paymentDataResponse.data.paymentData);
        setCreatedBookingId(paymentDataResponse.data.orderId); // Use orderId instead of tempBookingId
        setShowPayment(true);
        // Scroll to top to show payment form
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      } else {
        toast.error(paymentDataResponse.message || 'Failed to initialize payment');
        sessionStorage.removeItem('pendingBooking');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred. Please try again.');
      sessionStorage.removeItem('pendingBooking');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    if (selectedRoute && formData.seatNumbers.length > 0) {
      const basePrice = selectedRoute.price * formData.seatNumbers.length;
      return basePrice + BOOKING_FEE;
    }
    return 0;
  };

  const getBaseAmount = () => {
    if (selectedRoute && formData.seatNumbers.length > 0) {
      return selectedRoute.price * formData.seatNumbers.length;
    }
    return 0;
  };

  const getBookingFeeAmount = () => {
    return BOOKING_FEE;
  };

  const handleBackClick = () => {
    if (showPayment) {
      setShowPayment(false);
      setCurrentStep(4);
      return;
    }

    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);

      if (newStep === 1) {
        router.replace('/booking', { scroll: false });
        setSelectedRoute(null);
        setSelectedBus(null);
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
      }
    } else {
      router.push('/');
    }
  };

  const handleStepClick = (step: number) => {
    if (showPayment) return; // Don't allow navigation during payment

    if (step === 1) {
      setCurrentStep(1);
      router.replace('/booking', { scroll: false });
      setSelectedRoute(null);
      setSelectedBus(null);
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
      return;
    }

    if (step === 2) {
      if (!formData.routeId) {
        toast.error(t('booking.selectRouteFirst'));
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (step === 3) {
      if (!formData.routeId) {
        toast.error(t('booking.selectRouteFirst'));
        return;
      }
      if (!formData.busId || !formData.travelDate || !formData.pickupLocation) {
        toast.error(t('booking.completeBusDetails'));
        return;
      }
      const bus = buses.find(b => b._id === formData.busId);
      setSelectedBus(bus || null);
      setCurrentStep(3);
      return;
    }

    if (step === 4) {
      if (!formData.routeId) {
        toast.error(t('booking.selectRouteFirst'));
        return;
      }
      if (!formData.busId || !formData.travelDate || !formData.pickupLocation) {
        toast.error(t('booking.completeBusDetails'));
        return;
      }
      if (formData.seatNumbers.length !== formData.passengers) {
        toast.error(t('booking.selectSeatsFirst'));
        return;
      }
      setCurrentStep(4);
      return;
    }
  };

  const isStepAccessible = (step: number) => {
    if (step === 1) return true;
    if (step === 2) return formData.routeId !== '';
    if (step === 3) return formData.routeId !== '' && formData.busId !== '' && formData.travelDate !== '' && formData.pickupLocation !== '';
    if (step === 4) return formData.routeId !== '' && formData.busId !== '' && formData.travelDate !== '' && formData.pickupLocation !== '' && formData.seatNumbers.length === formData.passengers;
    return false;
  };

  const renderSeatLayout = () => {
  if (!selectedBus) return null;

  // --- New Layout Definition ---
  // Define the seat layout based on your image
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
  // --- End of New Layout ---


  // Helper component for a single seat
  // This cleans up the main layout code significantly.
  // It has access to the parent's state (formData, availableSeats, etc.)
  const SeatButton = ({ seatNumber }: { seatNumber: number }) => {
  const isAvailable = availableSeats.includes(seatNumber);
  const isSelected = formData.seatNumbers.includes(seatNumber);
  const isBooked = bookedSeats.includes(seatNumber);
    const isLocked = seatNumber === 1 || seatNumber === 2; // Lock seats 1 and 2

  return (
  <button
  key={seatNumber}
  type="button"
  disabled={!isAvailable || isBooked || isLocked}
  onClick={() => toggleSeatSelection(seatNumber)}
  className={`
  w-8 h-8 md:w-12 md:h-12 rounded-sm md:rounded-lg border-2 text-sm font-medium transition-all
  ${
  isSelected
  ? 'bg-sky-500 text-white border-sky-500 scale-105 shadow-lg'
  : isBooked
  ? 'bg-red-100 border-red-300 cursor-not-allowed text-red-400'
  : isLocked
  ? 'bg-gray-300 border-gray-400 cursor-not-allowed text-gray-500' // Locked seats styling
      : backgroundImage
        ? 'bg-white/80 backdrop-blur-sm border-white/50 hover:border-sky-400 hover:bg-white text-gray-700'
          : 'bg-white border-green-400 hover:border-sky-400 hover:bg-sky-50 text-gray-700'
    }
  `}
    title={isLocked ? 'This seat is reserved' : undefined}
    >
        {/* Format number to be two digits (e.g., 1 -> 01) */}
        {seatNumber.toString().padStart(2, '0')}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Bus Front (Kept from your original code) */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center gap-4 px-6 py-2 rounded-t-lg ${backgroundImage ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}`}>
          <span className={`text-sm font-medium ${backgroundImage ? 'text-white' : 'text-gray-600'}`}>🚍 Bus Front</span>
        </div>
      </div>

      <div className={`p-6 rounded-lg border-2 ${backgroundImage ? 'bg-white/10 backdrop-blur-sm border-white/20' : 'bg-gray-50 border-gray-300'}`}>
        {/* Driver and Entrance (Kept from your original code) */}
        <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* Entrance - Always Left */}
          <div className={`
            flex items-center gap-1.5 sm:gap-2 
            px-2 sm:px-4 py-1.5 sm:py-2.5 
            rounded-md sm:rounded-lg
            ${backgroundImage ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}
          `}>
            <span className="text-lg sm:text-2xl">🚪</span>
            <span className={`
              text-[10px] sm:text-sm font-medium whitespace-nowrap
              ${backgroundImage ? 'text-white' : 'text-gray-600'}
            `}>
              {'Entrance'}
            </span>
          </div>

          {/* Driver - Always Right */}
          <div className={`
            flex items-center gap-1.5 sm:gap-2 
            px-2 sm:px-4 py-1.5 sm:py-2.5 
            rounded-md sm:rounded-lg
            ${backgroundImage ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}
          `}>
            <span className={`
              text-[10px] sm:text-sm font-medium whitespace-nowrap
              ${backgroundImage ? 'text-white' : 'text-gray-600'}
            `}>
              {'Driver'}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* --- New Main Seats Layout --- */}
        {/* This container creates the aisle with 'justify-between' */}
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
          {/* Right Column */}
          <div className="space-y-3">
            {rightColumnRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2">
                <SeatButton seatNumber={row[0]} />
                {/* --- THIS LINE IS FIXED --- */}
                <SeatButton seatNumber={row[1]} /> 
              </div>
            ))}
          </div>
        </div>
        {/* --- End of Main Seats --- */}


        {/* Back seats (From your original code, now using the new layout) */}
        <div className={`flex justify-center mt-6 pt-4 ${backgroundImage ? 'border-t-2 border-white/30' : 'border-t-2 border-gray-300'}`}>
          <div className="flex gap-2">
            {backRowSeats.map((seatNumber) => (
              <SeatButton key={seatNumber} seatNumber={seatNumber} />
            ))}
          </div>
        </div>
      </div>

      {/* Legend (Kept from your original code) */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-4">
      <div className="flex items-center gap-2">
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded ${backgroundImage ? 'bg-white/80 border-2 border-white/50' : 'bg-white border-2 border-green-400'}`}></div>
      <span className={`text-sm ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>{t('booking.available')}</span>
      </div>
      <div className="flex items-center gap-2">
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-sky-500 border-2 border-sky-500 rounded"></div>
      <span className={`text-sm ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>{t('booking.selected')}</span>
      </div>
      <div className="flex items-center gap-2">
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 border-2 border-red-300 rounded"></div>
      <span className={`text-sm ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>{t('booking.booked')}</span>
      </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 border-2 border-gray-400 rounded"></div>
          <span className={`text-sm ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>Reserved</span>
        </div>
      </div>
    </div>
  );
};

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -50 }
  };

  const clearFilters = () => {
    setFromLocation('');
    setToLocation('');
  };

  const HelpModal = () => (
    <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-sky-900">
                  {t('booking.howToBook')}
                </DialogTitle>
                <DialogDescription className="text-sky-700">
                  {t('booking.followSteps')}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelpModal(false)}
              className="h-8 w-8 rounded-full hover:bg-red-100"
            >
              <X className="h-5 w-5 text-red-500" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-6 border-l-4 border-sky-600 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-sky-600 text-white">
                    {t('booking.step')} 1
                  </Badge>
                  <h3 className="text-xl font-bold text-gray-900">
                    {t('booking.searchRoute')}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {t('booking.searchRouteDesc')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-purple-500 text-white">
                    {t('booking.step')} 2
                  </Badge>
                  <h3 className="text-xl font-bold text-gray-900">
                    {t('booking.selectSeatsTitle')}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {t('booking.selectSeatsDesc')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-green-500 text-white">
                    {t('booking.step')} 3
                  </Badge>
                  <h3 className="text-xl font-bold text-gray-900">
                    {t('booking.confirmBookingTitle')}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {t('booking.confirmBookingDesc')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-300 shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 mb-3 text-lg">
                  ⚠️ {t('booking.important')}
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>A service fee of LKR {BOOKING_FEE}/= applies per booking (not per seat)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{t('booking.arriveEarly')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{t('booking.carryId')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{t('booking.saveBookingId')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Buses are locked for booking 30 minutes before departure</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={() => setShowHelpModal(false)}
              className="px-8 bg-sky-600 hover:bg-sky-700"
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Got it, Thanks!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen relative mt-20">
      {backgroundImage && (
        <>
          <div className="fixed inset-0 z-0">
            <Image
              src={backgroundImage}
              alt="Background"
              fill
              priority
              quality={85}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
        </>
      )}

      {!backgroundImage && (
        <div className="fixed inset-0 z-0 bg-white"></div>
      )}

      <motion.button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-2 right-2 z-50 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-2xl hover:shadow-sky-600/50 transition-all duration-300 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3 px-6 py-3">
          <div className="relative">
            <HelpCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          <span className="font-semibold text-sm">{t('booking.bookingHelp')}</span>
        </div>
      </motion.button>

      <HelpModal />

      <header className={`${backgroundImage ? 'bg-transparent backdrop-blur-md border-b border-white/20' : 'bg-white'} shadow-sm sticky top-0 z-40`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`${backgroundImage ? 'text-white hover:bg-white/20' : 'text-primary hover:text-primary/80'}`}
                onClick={handleBackClick}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('booking.back')}
              </Button>
              <h1 className={`text-xl font-bold ${backgroundImage ? 'text-white' : 'text-primary'}`}>{t('booking.title')}</h1>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    onClick={() => handleStepClick(step)}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${currentStep >= step
                        ? 'bg-sky-600 text-white'
                        : backgroundImage
                          ? 'bg-white/20 text-white backdrop-blur-sm'
                          : 'bg-gray-200 text-gray-500'
                      }
                      ${isStepAccessible(step)
                        ? 'cursor-pointer hover:scale-110 hover:shadow-md'
                        : 'cursor-not-allowed opacity-60'
                      }
                    `}
                    title={isStepAccessible(step) ? `${t('booking.goToStep')} ${step}` : t('booking.completePrevious')}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <ChevronRight className={`w-4 h-4 mx-2 ${currentStep > step
                      ? 'text-sky-600'
                      : backgroundImage
                        ? 'text-white/50'
                        : 'text-gray-300'
                      }`} />
                  )}
                </div>
              ))}
              {showPayment && (
                <>
                  <ChevronRight className="w-4 h-4 mx-2 text-sky-600" />
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-sky-600 text-white">
                    5
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: SELECT ROUTE */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={{ duration: 0.3 }}
            >

              <Card className="mb-6 bg-gradient-to-br from-white via-sky-50/30 to-white border-sky-200 shadow-lg">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="mb-6 text-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                      {t('booking.findYourRoute')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 items-center justify-center">
                    <div className="lg:col-span-5 space-y-2">
                      <div className="relative group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          <Label className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wide">
                            {t('booking.departureLocation')}
                          </Label>
                        </div>

                        <div className="relative">
                          <Select value={fromLocation} onValueChange={setFromLocation}>
                            <SelectTrigger className="h-12 w-full sm:h-14 border-2 border-sky-300 bg-white hover:bg-sky-50 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 shadow-sm hover:shadow-md group-hover:border-sky-400 rounded-xl">
                              <SelectValue
                                placeholder={
                                  <span className="flex items-center gap-2 text-gray-400">
                                    <MapPin className="w-4 h-4" />
                                    {t('booking.whereLeaving')}
                                  </span>
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 border-sky-200 shadow-xl">
                              <SelectItem
                                value="all"
                                className="text-sm sm:text-base hover:bg-sky-50 focus:bg-sky-50 py-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">📍</span>
                                  <span className="font-medium">{t('booking.allLocations')}</span>
                                </div>
                              </SelectItem>
                              {availableFromLocations.map((location) => (
                                <SelectItem
                                  key={location}
                                  value={location}
                                  className="text-sm sm:text-base hover:bg-sky-50 focus:bg-sky-50 py-3"
                                >
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-sky-600" />
                                    <span>{location}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {fromLocation && fromLocation !== 'all' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 flex items-center justify-center py-4 lg:py-0">
                      <div className="relative">
                        <div className="lg:hidden flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-gradient-to-b from-sky-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
                            {t('booking.to')}
                          </span>
                        </div>

                        <div className="hidden lg:flex items-center gap-3">
                          <div className="h-0.5 w-8 bg-gradient-to-r from-sky-400 to-blue-500" />
                          <div className="w-12 h-12 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </div>
                          <div className="h-0.5 w-8 bg-gradient-to-r from-sky-400 to-blue-500" />
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-2">
                      <div className="relative group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-600 rounded-full flex items-center justify-center shadow-md">
                            <MapPin className="w-4 h-4 text-white fill-white" />
                          </div>
                          <Label className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wide">
                            {t('booking.arrivalLocation')}
                          </Label>
                        </div>

                        <div className="relative">
                          <Select value={toLocation} onValueChange={setToLocation}>
                            <SelectTrigger className="h-12 w-full sm:h-14 border-2 border-blue-300 bg-white hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md group-hover:border-blue-400 rounded-xl">
                              <SelectValue
                                placeholder={
                                  <span className="flex items-center gap-2 text-gray-400">
                                    <MapPin className="w-4 h-4 fill-gray-400" />
                                    {t('booking.whereGoing')}
                                  </span>
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 border-blue-200 shadow-xl">
                              <SelectItem
                                value="all"
                                className="text-sm sm:text-base hover:bg-blue-50 focus:bg-blue-50 py-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🎯</span>
                                  <span className="font-medium">{t('booking.allDestinations')}</span>
                                </div>
                              </SelectItem>
                              {availableToLocations.map((location) => (
                                <SelectItem
                                  key={location}
                                  value={location}
                                  className="text-sm sm:text-base hover:bg-blue-50 focus:bg-blue-50 py-3"
                                >
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-600 fill-blue-600" />
                                    <span>{location}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {toLocation && toLocation !== 'all' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {(fromLocation || toLocation) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center"
                      >
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="w-full sm:w-auto px-6 h-11 border-2 border-sky-300 text-sky-700 hover:bg-sky-100 hover:border-sky-400 hover:text-sky-800 font-semibold rounded-full shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {t('booking.clearFilters')}
                        </Button>
                      </motion.div>
                    )}

                    {(fromLocation || toLocation) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden"
                      >
                        <p className="text-lg sm:text-xl font-bold text-gray-800">
                          {filteredRoutes.length}{" "}
                          {filteredRoutes.length === 1 ? t('booking.routeFound') : t('booking.routesFound')}
                        </p>
                      </motion.div>
                    )}
                  </div>

                </CardContent>
              </Card>

              {filteredRoutes.length === 0 ? (
                <Card className="border-sky-200">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-sky-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('booking.noRoutesFound')}</h3>
                    <p className="text-gray-600 mb-4">
                      {t('booking.noRoutesFoundDesc')}
                    </p>
                    <Button onClick={clearFilters} variant="outline" className="border-sky-200 text-sky-600 hover:bg-sky-50">
                      {t('booking.clearFilters')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredRoutes.map((route) => {
                    const routeBackground = getRouteCardBackground(route);
                    const hasBackground = !!routeBackground;
                    const isComingSoon = route.comeSoon;

                    return (
                      <div
                        key={route._id}
                        className={`
                          ${isComingSoon ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                          transition-all rounded-lg overflow-hidden relative group shadow-md
                          ${!isComingSoon && 'hover:shadow-xl'}
                          ${isComingSoon && 'opacity-75'}
                        `}
                        onClick={() => handleRouteSelect(route)}
                      >
                        {hasBackground && (
                          <>
                            <Image
                              src={routeBackground}
                              alt={route.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className={`object-cover ${isComingSoon ? 'grayscale' : ''}`}
                              quality={80}
                            />
                            <div className={`absolute inset-0 ${isComingSoon ? 'bg-black/70' : 'bg-black/60 group-hover:bg-black/30'} transition-all z-10`}></div>
                          </>
                        )}

                        {isComingSoon && (
                          <div className="absolute top-4 right-4 z-30">
                            <div className="relative">
                              <div className="bg-yellow-500 px-4 py-2 rounded-lg shadow-2xl">
                                <div className="flex items-center gap-2">
                                  <Lock className="w-5 h-5 text-black" />
                                  <div>
                                    <p className="text-sm text-black font-bold uppercase tracking-wide leading-none">
                                      {t('booking.comingSoon')}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="absolute inset-0 rounded-lg bg-yellow-400 animate-ping opacity-20"></div>
                            </div>
                          </div>
                        )}

                        <Card className={`${hasBackground ? 'bg-transparent border-white/20' : 'bg-white border-sky-100'} relative z-20 ${isComingSoon ? 'pointer-events-none' : ''}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className={`text-lg ${hasBackground ? 'text-white drop-shadow-lg' : 'text-gray-800'}`}>
                                {route.name}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className={`w-4 h-4 ${hasBackground ? 'text-white drop-shadow' : 'text-sky-600'}`} />
                                <span className={hasBackground ? 'text-white drop-shadow-lg font-bold text-2xl' : 'text-gray-600 font-semibold'}>
                                  {route.fromLocation} → {route.toLocation}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className={`w-4 h-4 ${hasBackground ? 'text-white drop-shadow' : 'text-sky-600'}`} />
                                <span className={hasBackground ? 'text-white drop-shadow-lg font-medium' : 'text-gray-600'}>
                                  {route.duration} {t('booking.minutes')}
                                </span>
                              </div>

                              {!isComingSoon && (
                                <div className="flex items-start gap-2 flex-wrap">
                                  <DollarSign className={`w-4 h-4 mt-1 ${hasBackground ? 'text-white drop-shadow' : 'text-sky-600'}`} />
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`font-bold text-lg ${hasBackground ? 'text-white drop-shadow-lg' : 'text-sky-600'}`}>
                                        {t('booking.lkr')}: {route.price}/=
                                      </span>
                                      <span className={`text-xs ${hasBackground ? 'text-white/80' : 'text-gray-500'}`}>{t('booking.perSeat')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Plus className={`w-3 h-3 ${hasBackground ? 'text-white/80' : 'text-gray-500'}`} />
                                      <Badge
                                        variant="secondary"
                                        className={`text-xs font-semibold px-2 py-0.5 ${hasBackground
                                          ? 'bg-amber-500 text-white border-amber-400 shadow-lg'
                                          : 'bg-amber-100 text-amber-700 border-amber-300'
                                          }`}
                                      >
                                        {t('booking.lkr')}: {BOOKING_FEE}/= {t('booking.serviceFee')}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {route.pickupLocations.length > 0 && (
                                <div className={`pt-2 ${hasBackground ? 'border-t border-white/30' : 'border-t border-sky-100'}`}>
                                  <p className={`text-xs mb-1 ${hasBackground ? 'text-white/90 drop-shadow' : 'text-gray-500'}`}>
                                    {t('booking.pickupPoints')}:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {route.pickupLocations.slice(0, 3).map((location, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className={`text-xs ${hasBackground ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm' : 'bg-sky-50 text-sky-700 border-sky-200'}`}
                                      >
                                        {location}
                                      </Badge>
                                    ))}
                                    {route.pickupLocations.length > 3 && (
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${hasBackground ? 'border-white/50 text-white backdrop-blur-sm' : 'border-sky-300 text-sky-600'}`}
                                      >
                                        +{route.pickupLocations.length - 3} {t('booking.more')}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: SELECT BUS & DATE */}
          {currentStep === 2 && !showPayment && (
            <motion.div
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className={`text-2xl font-bold mb-2 ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                  {t('booking.selectBus')}
                </h2>
                <p className={backgroundImage ? 'text-white/90' : 'text-gray-600'}>
                  {t('booking.selectBusDesc')}
                </p>
              </div>

              {selectedRoute && (
                <Card className={`mb-6 ${backgroundImage ? 'bg-black/50 backdrop-blur-md border-white/20' : 'border-sky-200'}`}>
                  <CardHeader>
                    <CardTitle className={backgroundImage ? 'text-white' : 'text-gray-800'}>
                      {t('booking.selectedRoute')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className={`w-5 h-5 ${backgroundImage ? 'text-white' : 'text-sky-600'}`} />
                      <span className={`font-semibold ${backgroundImage ? 'text-white text-xl' : 'text-gray-800'}`}>
                        {selectedRoute.fromLocation} → {selectedRoute.toLocation}
                      </span>
                    </div>
                    <p className={`text-sm ${backgroundImage ? 'text-white/80' : 'text-gray-600'}`}>
                      {selectedRoute.name}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className={backgroundImage ? 'bg-black/50 backdrop-blur-md border-white/20' : 'border-sky-200'}>
                <CardHeader>
                  <CardTitle className={backgroundImage ? 'text-white' : 'text-gray-800'}>
                    {t('booking.tripDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className={`flex items-center gap-2 ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>
                        <Calendar className="w-4 h-4" />
                        {t('booking.travelDate')}
                      </Label>
                      <Input
                        type="date"
                        value={formData.travelDate}
                        onChange={(e) => setFormData({ ...formData, travelDate: e.target.value, busId: '', seatNumbers: [] })}
                        min={new Date().toISOString().split('T')[0]}
                        className={backgroundImage ? 'bg-white/20 border-white/30 text-white placeholder:text-white/60' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={`flex items-center gap-2 ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>
                        <Users className="w-4 h-4" />
                        {t('booking.passengers')}
                      </Label>
                      <Select
                        value={formData.passengers.toString()}
                        onValueChange={(value) => setFormData({ ...formData, passengers: parseInt(value), seatNumbers: [] })}
                      >
                        <SelectTrigger className={backgroundImage ? 'bg-white/20 border-white/30 text-white' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? t('booking.passenger') : t('booking.passengers_plural')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.travelDate && selectedRoute && selectedRoute.pickupLocations.length > 0 && (
                    <div className="space-y-2">
                      <Label className={`flex items-center gap-2 ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>
                        <MapPin className="w-4 h-4" />
                        {t('booking.pickupLocation')}
                      </Label>
                      <Select
                        value={formData.pickupLocation}
                        onValueChange={(value) => setFormData({ ...formData, pickupLocation: value })}
                      >
                        <SelectTrigger className={backgroundImage ? 'bg-white/20 border-white/30 text-white' : ''}>
                          <SelectValue placeholder={t('booking.selectPickup')} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedRoute.pickupLocations.map((location, idx) => (
                            <SelectItem key={idx} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.travelDate && formData.pickupLocation && (
                    <div className="space-y-4">
                      <Label className={`flex items-center gap-2 text-lg font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                        <Bus className="w-5 h-5" />
                        {t('booking.availableBuses')}
                      </Label>

                      {buses.length === 0 ? (
                        <div className={`text-center py-12 rounded-xl ${backgroundImage ? 'bg-white/5 backdrop-blur-sm' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${backgroundImage ? 'bg-white/10' : 'bg-white shadow-lg'}`}>
                            <Bus className={`w-10 h-10 ${backgroundImage ? 'text-white/50' : 'text-gray-400'}`} />
                          </div>
                          <p className={`text-lg font-medium ${backgroundImage ? 'text-white/80' : 'text-gray-600'}`}>
                            {t('booking.noBuses')}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {buses.map((bus) => {
                            const isLocked = isBusLocked(bus, formData.travelDate);
                            const departureInfo = getTimeToDeparture(bus, formData.travelDate);
                            const isSelected = formData.busId === bus._id;

                            return (
                              <div
                                key={bus._id}
                                onClick={() => {
                                  if (!isLocked) {
                                    setFormData({ ...formData, busId: bus._id, seatNumbers: [] });
                                    setSelectedBus(bus);
                                  }
                                }}
                                className={`
            relative rounded-lg transition-all duration-200 transform
            ${isLocked
                                    ? 'cursor-not-allowed opacity-60'
                                    : 'cursor-pointer hover:-translate-y-1 active:scale-95'
                                  }
            ${isSelected ? 'scale-105 shadow-xl' : 'shadow hover:shadow-lg'}
          `}
                              >
                                {/* Card Background with Color States */}
                                <div className={`
            relative p-3 rounded-lg border-2 transition-all duration-200
            ${isLocked
                                    ? backgroundImage
                                      ? 'bg-gray-800/50 border-gray-600'
                                      : 'bg-gray-200 border-gray-300'
                                    : isSelected
                                      ? backgroundImage
                                        ? 'bg-green-600 border-green-400 shadow-green-500/50'
                                        : 'bg-green-600 border-green-400 shadow-green-500/50'
                                      : backgroundImage
                                        ? 'bg-blue-400/30 border-blue-400 hover:bg-blue-500 hover:border-blue-400'
                                        : 'bg-white border-gray-300 hover:bg-blue-500 hover:border-blue-400 hover:text-white'
                                  }
          `}>

                                  {/* Lock Badge */}
                                  {isLocked && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg z-10">
                                      <Lock className="w-3 h-3" />
                                    </div>
                                  )}

                                  {/* Departure Time Badge */}
                                  {departureInfo && !isLocked && (
                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg z-10 animate-pulse">
                                      {departureInfo}
                                    </div>
                                  )}

                                  {/* Selected Checkmark */}
                                  {isSelected && (
                                    <div className="absolute -top-2 -left-2 bg-white text-green-600 p-1 rounded-full shadow-lg z-10">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}

                                  {/* Bus Icon */}
                                  <div className="flex justify-center mb-2">
                                    <div className={`
                p-2 rounded-full transition-all duration-200
                ${isLocked
                                        ? 'bg-gray-400/30'
                                        : isSelected
                                          ? 'bg-white/20'
                                          : backgroundImage
                                            ? 'bg-white/20 group-hover:bg-white/30'
                                            : 'bg-blue-100 group-hover:bg-white/20'
                                      }
              `}>
                                      <Bus className={`
                  w-5 h-5 transition-colors duration-200
                  ${isLocked
                                          ? 'text-gray-500'
                                          : isSelected
                                            ? 'text-white'
                                            : backgroundImage
                                              ? 'text-white'
                                              : 'text-blue-600 group-hover:text-white'
                                        }
                `} />
                                    </div>
                                  </div>

                                  {/* Bus Number */}
                                  <h3 className={`
              text-center font-bold text-sm mb-1.5 transition-colors duration-200
              ${isLocked
                                      ? 'text-gray-600'
                                      : isSelected
                                        ? 'text-white'
                                        : backgroundImage
                                          ? 'text-white'
                                          : 'text-gray-800 group-hover:text-white'
                                    }
            `}>
                                    {bus.busNumber}
                                  </h3>

                                  {/* Capacity */}
                                  <div className={`
              text-center text-xs font-medium mb-2 transition-colors duration-200
              ${isLocked
                                      ? 'text-gray-500'
                                      : isSelected
                                        ? 'text-white/90'
                                        : backgroundImage
                                          ? 'text-white/80'
                                          : 'text-gray-600 group-hover:text-white/90'
                                    }
            `}>
                                    {bus.capacity} {t('booking.seats')}
                                  </div>

                                  {/* Divider */}
                                  <div className={`
              h-px mb-2 transition-colors duration-200
              ${isLocked
                                      ? 'bg-gray-400'
                                      : isSelected
                                        ? 'bg-white/30'
                                        : backgroundImage
                                          ? 'bg-white/20'
                                          : 'bg-gray-200 group-hover:bg-white/30'
                                    }
            `}></div>

                                  {/* Departure Time */}
                                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                    
                                    <span className={`
                text-xl font-semibold transition-colors duration-200
                ${isLocked
                                        ? 'text-gray-600'
                                        : isSelected
                                          ? 'text-white'
                                          : backgroundImage
                                            ? 'text-white'
                                            : 'text-gray-700 group-hover:text-white'
                                      }
              `}>
                                      {formatTime(bus.departureTime)}
                                    </span>
                                  </div>

                                  {/* Click Me Indicator - Only show on non-selected, non-locked */}
                                  {!isSelected && !isLocked && (
                                    <div className={`
                absolute inset-0 rounded-lg transition-all duration-200 pointer-events-none
                ${backgroundImage
                                        ? 'group-hover:ring-2 group-hover:ring-white/50'
                                        : 'group-hover:ring-2 group-hover:ring-blue-400'
                                      }
              `}>
                                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                  )}

                                  {/* Selected Pulse Effect */}
                                  {isSelected && (
                                    <div className="absolute inset-0 rounded-lg ring-2 ring-white/50 animate-pulse"></div>
                                  )}
                                </div>

                                {/* Locked Overlay */}
                                {isLocked && (
                                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                                      {t('booking.locked')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SEAT SELECTION */}
                  {formData.busId && formData.travelDate && formData.pickupLocation && (
                    <div className="space-y-4">
                      <Label className={`flex items-center gap-2 text-lg font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                        <Users className="w-5 h-5" />
                        {t('booking.selectSeats')}
                      </Label>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <Card className={backgroundImage ? 'bg-white/10 backdrop-blur-md border-white/20' : 'border-sky-200'}>
                            <CardHeader>
                              <CardTitle className={backgroundImage ? 'text-white' : 'text-gray-800'}>
                                {t('booking.seatLayout')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {seatLoading ? (
                                <div className="flex items-center justify-center py-12">
                                  <Loader2 className={`w-8 h-8 animate-spin ${backgroundImage ? 'text-white' : 'text-sky-600'}`} />
                                </div>
                              ) : (
                                renderSeatLayout()
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        <div className="lg:col-span-1">
                          <Card className={`sticky top-24 ${backgroundImage ? 'bg-white/10 backdrop-blur-md border-white/20' : 'border-sky-200'}`}>
                            <CardHeader>
                              <CardTitle className={backgroundImage ? 'text-white' : 'text-gray-800'}>
                                {t('booking.selectionSummary')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className={`p-3 rounded-lg ${backgroundImage ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <p className={`text-sm mb-1 ${backgroundImage ? 'text-white/70' : 'text-gray-600'}`}>
                                  {t('booking.selectedSeats')}
                                </p>
                                <p className={`font-bold text-lg ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                  {formData.seatNumbers.length > 0
                                    ? formData.seatNumbers.join(', ')
                                    : t('booking.noneSelected')
                                  }
                                </p>
                              </div>

                              {formData.seatNumbers.length < formData.passengers && (
                                <div className={`p-3 rounded-lg border ${backgroundImage ? 'bg-amber-500/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                                  <p className={`text-sm ${backgroundImage ? 'text-white' : 'text-amber-800'}`}>
                                    {t('booking.moreSeats')}
                                  </p>
                                </div>
                              )}

                              {selectedRoute && formData.seatNumbers.length > 0 && (
                                <div className={`p-4 rounded-lg ${backgroundImage ? 'bg-white/10' : 'bg-sky-50'}`}>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className={backgroundImage ? 'text-white/80' : 'text-gray-600'}>
                                        {t('booking.pricePerSeat')}:
                                      </span>
                                      <span className={`font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                        {t('booking.lkr')} {selectedRoute.price}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className={backgroundImage ? 'text-white/80' : 'text-gray-600'}>
                                        {t('booking.seats')}:
                                      </span>
                                      <span className={`font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                        {formData.seatNumbers.length}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className={backgroundImage ? 'text-white/80' : 'text-gray-600'}>
                                        {t('booking.subtotal')}:
                                      </span>
                                      <span className={`font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                        {t('booking.lkr')} {getBaseAmount()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className={backgroundImage ? 'text-white/80' : 'text-gray-600'}>
                                        {t('booking.serviceFee')}:
                                      </span>
                                      <span className={`font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                        {t('booking.lkr')} {getBookingFeeAmount()}
                                      </span>
                                    </div>
                                    <div className={`pt-2 border-t ${backgroundImage ? 'border-white/30' : 'border-gray-300'} flex justify-between`}>
                                      <span className={`font-bold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                        {t('booking.totalAmount')}:
                                      </span>
                                      <span className={`font-bold text-xl ${backgroundImage ? 'text-white' : 'text-sky-600'}`}>
                                        {t('booking.lkr')} {getTotalAmount()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PASSENGER DETAILS */}
                  {formData.busId && formData.travelDate && formData.pickupLocation && formData.seatNumbers.length === formData.passengers && (
                    <div className="space-y-4">
                      <Label className={`flex items-center gap-2 text-lg font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                        <User className="w-5 h-5" />
                        {t('booking.passengerDetails')}
                      </Label>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <Card className={backgroundImage ? 'bg-white/10 backdrop-blur-md border-white/20' : 'border-sky-200'}>
                            <CardHeader>
                              <CardTitle className={backgroundImage ? 'text-white' : 'text-gray-800'}>
                                {t('booking.contactInformation')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                  <Label className={`flex items-center gap-2 ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>
                                    <User className="w-4 h-4" />
                                    {t('booking.fullName')}
                                  </Label>
                                  <Input
                                    value={formData.passengerName}
                                    onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                                    placeholder={t('booking.enterFullName')}
                                    required
                                    className={backgroundImage ? 'bg-white/20 border-white/30 text-white placeholder:text-white/60' : ''}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className={`flex items-center gap-2 ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>
                                    <Phone className="w-4 h-4" />
                                    {t('booking.phoneNumber')}
                                  </Label>
                                  <Input
                                    value={formData.passengerPhone}
                                    onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                                    placeholder={t('booking.enterPhone')}
                                    required
                                    className={backgroundImage ? 'bg-white/20 border-white/30 text-white placeholder:text-white/60' : ''}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className={`flex items-center gap-2 ${backgroundImage ? 'text-white' : 'text-gray-700'}`}>
                                    <Mail className="w-4 h-4" />
                                    {t('booking.email')} <span className="text-sm opacity-70">({t('booking.optional')})</span>
                                  </Label>
                                  <Input
                                    type="email"
                                    value={formData.passengerEmail}
                                    onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
                                    placeholder={t('booking.enterEmail')}
                                    className={backgroundImage ? 'bg-white/20 border-white/30 text-white placeholder:text-white/60' : ''}
                                  />
                                </div>

                                <div className={`p-4 rounded-lg ${backgroundImage ? 'bg-white/10 border border-white/20' : 'bg-sky-50 border border-sky-200'}`}>
                                  <div className="flex items-start gap-3">
                                    <Info className={`w-5 h-5 mt-0.5 ${backgroundImage ? 'text-white' : 'text-sky-600'}`} />
                                    <div>
                                      <h4 className={`font-semibold mb-2 ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                        {t('booking.important')}
                                      </h4>
                                      <ul className={`text-sm space-y-1 ${backgroundImage ? 'text-white/90' : 'text-gray-700'}`}>
                                        <li>• {t('booking.arriveEarly')}</li>
                                        <li>• {t('booking.carryId')}</li>
                                        <li>• {t('booking.saveBookingId')}</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>

                                <Button
                                  type="submit"
                                  disabled={loading}
                                  className="w-full bg-sky-600 hover:bg-sky-700"
                                  size="lg"
                                >
                                  {loading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      {t('booking.processing')}
                                    </>
                                  ) : (
                                    <>
                                      {t('booking.confirmBooking')}
                                      <CheckCircle className="w-4 h-4 ml-2" />
                                    </>
                                  )}
                                </Button>
                              </form>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="lg:col-span-1">
                          <Card className={`sticky top-24 ${backgroundImage ? 'bg-white/10 backdrop-blur-md border-white/20' : 'border-sky-200'}`}>
                            <CardHeader>
                              <CardTitle className={backgroundImage ? 'text-white' : 'text-gray-800'}>
                                {t('booking.bookingSummary')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {selectedRoute && (
                                <div>
                                  <p className={`text-sm mb-1 ${backgroundImage ? 'text-white/70' : 'text-gray-600'}`}>
                                    {t('booking.route')}
                                  </p>
                                  <p className={`font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                    {selectedRoute.fromLocation} → {selectedRoute.toLocation}
                                  </p>
                                </div>
                              )}

                              {selectedBus && (
                                <div>
                                  <p className={`text-sm mb-1 ${backgroundImage ? 'text-white/70' : 'text-gray-600'}`}>
                                    {t('booking.selectedBus')}
                                  </p>
                                  <p className={`font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                    {selectedBus.busNumber}
                                  </p>
                                </div>
                              )}

                              <div>
                                <p className={`text-sm mb-1 ${backgroundImage ? 'text-white/70' : 'text-gray-600'}`}>
                                  {t('booking.date')}
                                </p>
                                <p className={`font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                  {new Date(formData.travelDate).toLocaleDateString()}
                                </p>
                              </div>

                              <div>
                                <p className={`text-sm mb-1 ${backgroundImage ? 'text-white/70' : 'text-gray-600'}`}>
                                  {t('booking.pickupLocation')}
                                </p>
                                <p className={`font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                  {formData.pickupLocation}
                                </p>
                              </div>

                              <div>
                                <p className={`text-sm mb-1 ${backgroundImage ? 'text-white/70' : 'text-gray-600'}`}>
                                  {t('booking.selectedSeats')}
                                </p>
                                <p className={`font-semibold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                  {formData.seatNumbers.join(', ')}
                                </p>
                              </div>

                              {selectedRoute && (
                                <div className={`pt-4 border-t ${backgroundImage ? 'border-white/30' : 'border-gray-200'}`}>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className={backgroundImage ? 'text-white/80' : 'text-gray-600'}>
                                        {t('booking.subtotal')}
                                      </span>
                                      <span className={backgroundImage ? 'text-white' : 'text-gray-800'}>
                                        {t('booking.lkr')} {getBaseAmount()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className={backgroundImage ? 'text-white/80' : 'text-gray-600'}>
                                        {t('booking.serviceFee')}
                                      </span>
                                      <span className={backgroundImage ? 'text-white' : 'text-gray-800'}>
                                        {t('booking.lkr')} {getBookingFeeAmount()}
                                      </span>
                                    </div>
                                    <div className={`pt-2 border-t ${backgroundImage ? 'border-white/30' : 'border-gray-200'} flex justify-between`}>
                                      <span className={`font-bold ${backgroundImage ? 'text-white' : 'text-gray-800'}`}>
                                        {t('booking.totalAmount')}
                                      </span>
                                      <span className={`font-bold text-xl ${backgroundImage ? 'text-white' : 'text-sky-600'}`}>
                                        {t('booking.lkr')} {getTotalAmount()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}



          {/* STEP 5: PAYMENT */}
          {showPayment && paymentData && (
            <motion.div
              key="step5"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <PayhereCheckoutInline
                paymentData={paymentData}
                bookingId={createdBookingId}
                bookingDetails={{
                  route: selectedRoute,
                  bus: selectedBus,
                  formData: formData,
                  totalAmount: getTotalAmount(),
                  baseAmount: getBaseAmount(),
                  serviceFee: getBookingFeeAmount()
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}