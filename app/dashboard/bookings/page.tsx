// app/dashboard/bookings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Plus,
    Search,
    MoreHorizontal,
    Eye,
    Trash2,
    CreditCard,
    CheckCircle,
    XCircle,
    Ticket,
    Edit,
    Calendar,
    RefreshCw,
    AlertCircle,
    FileText,
    Download,
    Filter,
    X
} from 'lucide-react';
import { IBooking, IBus, IRoute } from '@/types';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

interface AvailableSeatsResponse {
    totalSeats: number;
    bookedSeats: number[];
    availableSeats: number[];
    availableCount: number;
}

export default function BookingsPage() {
    const router = useRouter();
    const { user, hasPermission, hasRole } = useAuth();
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Bulk selection states
    const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
    const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);
    const [bulkActionType, setBulkActionType] = useState<'cancel'>('cancel');
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // Filter states
    const [routes, setRoutes] = useState<IRoute[]>([]);
    const [buses, setBuses] = useState<IBus[]>([]);
    const [filteredBuses, setFilteredBuses] = useState<IBus[]>([]);
    const [filters, setFilters] = useState({
        date: '',
        routeId: '',
        busId: ''
    });
    const [isFilterActive, setIsFilterActive] = useState(false);

    // Modal states
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    // Edit form states
    const [editForm, setEditForm] = useState({
        travelDate: '',
        seatNumbers: [] as number[],
        pickupLocation: '',
        passengerName: '',
        passengerPhone: '',
        passengerEmail: '',
        notes: '',
        paymentStatus: 'pending' as 'pending' | 'failed' | 'paid' | 'refunded',
        status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed'
    });

    // Available seats
    const [availableSeats, setAvailableSeats] = useState<number[]>([]);
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [totalSeats, setTotalSeats] = useState(0);

    useEffect(() => {
        if (hasPermission('bookings:read')) {
            fetchBookings(1); // Start with page 1
            fetchRoutes();
            fetchBuses();
        }
    }, [hasPermission]);

    useEffect(() => {
        applyFilters();
    }, [bookings, searchTerm]);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (hasPermission('bookings:read')) {
            setCurrentPage(1);
            setSelectedBookings([]); // Clear selections when filters change
            fetchBookings(1);
        }
    }, [filters, hasPermission]);

    // Clear selections when page changes
    useEffect(() => {
        setSelectedBookings([]);
    }, [currentPage]);

    // ====================================
    // FILTER BUSES BASED ON SELECTED ROUTE
    // ====================================
    useEffect(() => {
        filterBusesByRoute();
    }, [filters.routeId, buses]);

    const filterBusesByRoute = () => {
        if (!filters.routeId || filters.routeId === 'all') {
            setFilteredBuses(buses);
        } else {
            const filtered = buses.filter(bus => {
                const busRouteId = typeof bus.routeId === 'object' ? bus.routeId._id : bus.routeId;
                return busRouteId === filters.routeId;
            });
            setFilteredBuses(filtered);

            // If current selected bus is not in the filtered list, reset bus selection
            if (filters.busId && filters.busId !== 'all') {
                const isBusValid = filtered.some(bus => bus._id === filters.busId);
                if (!isBusValid) {
                    setFilters(prev => ({ ...prev, busId: '' }));
                }
            }
        }
    };

    const fetchBookings = async (page: number = 1) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            // Add filter params if they exist
            if (filters.date) queryParams.append('travelDate', filters.date);
            if (filters.routeId && filters.routeId !== 'all') queryParams.append('routeId', filters.routeId);
            if (filters.busId && filters.busId !== 'all') queryParams.append('busId', filters.busId);

            const response = await fetch(`/api/bookings?${queryParams}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setBookings(data.data.bookings);
                setCurrentPage(data.data.pagination.currentPage);
                setTotalPages(data.data.pagination.totalPages);
                setTotalCount(data.data.pagination.totalCount);
            } else {
                toast.error('Failed to fetch bookings');
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoutes = async () => {
        try {
            const response = await fetch('/api/routes', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setRoutes(data.data);
            }
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    };

    const fetchBuses = async () => {
        try {
            const response = await fetch('/api/buses', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setBuses(data.data);
                setFilteredBuses(data.data); // Initialize filtered buses
            }
        } catch (error) {
            console.error('Error fetching buses:', error);
        }
    };

    const applyFilters = () => {
        // Since filtering is now done on the backend, we just update the filteredBookings
        // and reset to page 1 when filters change
        let filtered = [...bookings];

        // Only apply search filter on frontend since it's a text search
        if (searchTerm) {
            filtered = filtered.filter(booking =>
                booking.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.passengerPhone.includes(searchTerm.toLowerCase()) ||
                booking._id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredBookings(filtered);
        setIsFilterActive(filters.date !== '' || (filters.routeId !== '' && filters.routeId !== 'all') || (filters.busId !== '' && filters.busId !== 'all'));
    };

    const clearFilters = () => {
        setFilters({
            date: '',
            routeId: '',
            busId: ''
        });
        setSearchTerm('');
        setIsFilterActive(false);
        setCurrentPage(1);
        fetchBookings(1);
    };

    const handleRouteFilterChange = (value: string) => {
        setFilters({
            ...filters,
            routeId: value,
            busId: '' // Reset bus selection when route changes
        });
    };

    const handleGeneratePDF = async () => {
        try {
            setGeneratingPDF(true);

            const response = await fetch('/api/bookings/generate-report', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                filters
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `booking-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('PDF report generated successfully');
            } else {
                toast.error('Failed to generate PDF report');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF report');
        } finally {
            setGeneratingPDF(false);
        }
    };

    const fetchAvailableSeats = async (busId: string, travelDate: string, currentBookingId?: string) => {
        try {
            setLoadingSeats(true);
            const response = await fetch(
                `/api/bookings/available-seats?busId=${busId}&travelDate=${travelDate}&excludeBookingId=${currentBookingId || ''}`,
                {
                    credentials: 'include'
                }
            );

            if (response.ok) {
                const data = await response.json();
                setAvailableSeats(data.data.availableSeats);
                setTotalSeats(data.data.totalSeats);
            } else {
                toast.error('Failed to fetch available seats');
            }
        } catch (error) {
            console.error('Error fetching seats:', error);
            toast.error('Network error occurred');
        } finally {
            setLoadingSeats(false);
        }
    };

    const handleCreateBooking = () => {
        router.push('/dashboard/bookings/create');
    };

    const handleViewDetails = (booking: IBooking) => {
        setSelectedBooking(booking);
        setIsDetailModalOpen(true);
    };

    const handleEditBooking = async (booking: IBooking) => {
        setSelectedBooking(booking);
        setEditForm({
            travelDate: format(new Date(booking.travelDate), 'yyyy-MM-dd'),
            seatNumbers: booking.seatNumbers,
            pickupLocation: booking.pickupLocation || '',
            passengerName: booking.passengerName,
            passengerPhone: booking.passengerPhone,
            passengerEmail: booking.passengerEmail || '',
            notes: booking.notes || '',
            paymentStatus: booking.paymentStatus,
            status: booking.status
        });

        if (typeof booking.busId === 'object' && booking.busId._id) {
            await fetchAvailableSeats(
                booking.busId._id,
                format(new Date(booking.travelDate), 'yyyy-MM-dd'),
                booking._id
            );
        }

        setIsEditModalOpen(true);
    };

    const handleDeleteBooking = (booking: IBooking) => {
        setSelectedBooking(booking);
        setIsDeleteDialogOpen(true);
    };

    const handleRefundBooking = (booking: IBooking) => {
        setSelectedBooking(booking);
        setIsRefundDialogOpen(true);
    };

    const handleConfirmBooking = (booking: IBooking) => {
        setSelectedBooking(booking);
        setIsConfirmDialogOpen(true);
    };

    // Bulk selection handlers
    const handleSelectAllBookings = (checked: boolean) => {
        if (checked) {
            setSelectedBookings(filteredBookings.map(booking => booking._id));
        } else {
            setSelectedBookings([]);
        }
    };

    const handleSelectBooking = (bookingId: string, checked: boolean) => {
        if (checked) {
            setSelectedBookings(prev => [...prev, bookingId]);
        } else {
            setSelectedBookings(prev => prev.filter(id => id !== bookingId));
        }
    };



    const handleBulkCancel = () => {
        setBulkActionType('cancel');
        setIsBulkActionDialogOpen(true);
    };


    const confirmBulkAction = async () => {
        if (selectedBookings.length === 0) return;

        try {
            setBulkProcessing(true);
            const response = await fetch('/api/bookings/delete-bulk', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingIds: selectedBookings,
                    action: bulkActionType
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                setIsBulkActionDialogOpen(false);
                setSelectedBookings([]);
                fetchBookings(currentPage); // Refresh current page
            } else {
                const data = await response.json();
                toast.error(data.message || `Failed to ${bulkActionType} bookings`);
            }
        } catch (error) {
            console.error(`Error bulk ${bulkActionType} bookings:`, error);
            toast.error('Network error occurred');
        } finally {
            setBulkProcessing(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchBookings(page);
    };

    const confirmDeleteBooking = async () => {
        if (!selectedBooking) return;

        try {
            const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                toast.success('Booking cancelled successfully');
                setIsDeleteDialogOpen(false);
                fetchBookings(currentPage);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to cancel booking');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error('Network error occurred');
        }
    };

    const confirmRefund = async () => {
        if (!selectedBooking) return;

        try {
            const response = await fetch(`/api/bookings/${selectedBooking._id}/refund`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                toast.success('Booking refunded successfully');
                setIsRefundDialogOpen(false);
                fetchBookings(currentPage);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to refund booking');
            }
        } catch (error) {
            console.error('Error refunding booking:', error);
            toast.error('Network error occurred');
        }
    };

    const confirmBooking = async () => {
        if (!selectedBooking) return;

        try {
            const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'confirmed' })
            });

            if (response.ok) {
                toast.success('Booking confirmed successfully');
                setIsConfirmDialogOpen(false);
                fetchBookings(currentPage);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to confirm booking');
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
            toast.error('Network error occurred');
        }
    };

    const handleTravelDateChange = async (date: string) => {
        setEditForm({ ...editForm, travelDate: date, seatNumbers: [] });

        if (selectedBooking && typeof selectedBooking.busId === 'object' && selectedBooking.busId._id) {
            await fetchAvailableSeats(selectedBooking.busId._id, date, selectedBooking._id);
        }
    };

    const handleSeatToggle = (seatNumber: number) => {
        setEditForm(prev => {
            const isSelected = prev.seatNumbers.includes(seatNumber);
            const originalSeatCount = selectedBooking?.seatNumbers.length || 0;

            if (isSelected) {
                return {
                    ...prev,
                    seatNumbers: prev.seatNumbers.filter(s => s !== seatNumber)
                };
            } else {
                if (!availableSeats.includes(seatNumber) && !prev.seatNumbers.includes(seatNumber)) {
                    toast.error('This seat is already booked');
                    return prev;
                }

                if (prev.seatNumbers.length >= originalSeatCount) {
                    toast.error(`You can only select ${originalSeatCount} seat${originalSeatCount === 1 ? '' : 's'} (same as original booking)`);
                    return prev;
                }

                return {
                    ...prev,
                    seatNumbers: [...prev.seatNumbers, seatNumber]
                };
            }
        });
    };

    const handleUpdateBooking = async () => {
        if (!selectedBooking) return;

        const requiredSeats = selectedBooking.seatNumbers.length;
        if (editForm.seatNumbers.length !== requiredSeats) {
            toast.error(`Please select exactly ${requiredSeats} seat${requiredSeats === 1 ? '' : 's'} (same as original booking)`);
            return;
        }

        if (!editForm.passengerName || !editForm.passengerPhone) {
            toast.error('Passenger name and phone are required');
            return;
        }

        try {
            let totalAmount = selectedBooking.totalAmount;

            if (typeof selectedBooking.routeId === 'object') {
                totalAmount = selectedBooking.routeId.price * editForm.seatNumbers.length;
            }

            const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...editForm,
                    totalAmount
                })
            });

            if (response.ok) {
                toast.success('Booking updated successfully');
                setIsEditModalOpen(false);
                fetchBookings(currentPage);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to update booking');
            }
        } catch (error) {
            console.error('Error updating booking:', error);
            toast.error('Network error occurred');
        }
    };

    const isWithinRefundPeriod = (bookingDate: Date): boolean => {
        const daysDifference = differenceInDays(new Date(), new Date(bookingDate));
        return daysDifference <= 7;
    };

    const canEditBooking = (booking: IBooking): boolean => {
        return isWithinRefundPeriod(booking.bookingDate) && booking.status !== 'completed';
    };

    const canRefund = (booking: IBooking): boolean => {
        return booking.paymentStatus === 'paid' &&
            isWithinRefundPeriod(booking.bookingDate) &&
            booking.status !== 'completed';
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentBadgeColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'refunded':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const renderSeatLayout = () => {
        if (!selectedBooking) return null;

        // Define the seat layout based on the user booking page
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
            const isSelected = editForm.seatNumbers.includes(seatNumber);
            const isAvailable = availableSeats.includes(seatNumber);
            const isBooked = !isAvailable && !isSelected;
            const isOriginalSeat = selectedBooking?.seatNumbers.includes(seatNumber);

            return (
                <button
                    key={seatNumber}
                    type="button"
                    disabled={isBooked}
                    onClick={() => handleSeatToggle(seatNumber)}
                    className={`
            relative w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 text-sm font-medium transition-all transform hover:scale-105
            ${isSelected
                            ? 'bg-green-500 text-white border-green-500 scale-105 shadow-lg'
                            : isBooked
                                ? 'bg-red-100 border-red-300 cursor-not-allowed text-red-400'
                                : isAvailable
                                    ? 'bg-white border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700'
                                    : 'bg-gray-200 border-gray-400 text-gray-500'
                        }
            ${isOriginalSeat && !isSelected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
          `}
                    title={isOriginalSeat ? `Original seat ${seatNumber}` : `Seat ${seatNumber}`}
                >
                    {/* Format number to be two digits (e.g., 1 -> 01) */}
                    {seatNumber.toString().padStart(2, '0')}
                    {isOriginalSeat && !isSelected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                    )}
                </button>
            );
        };

        return (
            <div className="space-y-4">
                {/* Bus Front */}
                <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-4 px-6 py-2 rounded-t-lg bg-gray-100">
                        <span className="text-sm font-medium text-gray-600">🚍 Bus Front</span>
                    </div>
                </div>

                <div className="p-6 rounded-lg border-2 bg-gray-50 border-gray-300">
                    {/* Driver and Entrance */}
                    <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                        {/* Entrance - Always Left */}
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg bg-gray-100">
                            <span className="text-lg sm:text-2xl">🚪</span>
                            <span className="text-[10px] sm:text-sm font-medium whitespace-nowrap text-gray-600">
                                Entrance
                            </span>
                        </div>

                        {/* Driver - Always Right */}
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg bg-gray-100">
                            <span className="text-[10px] sm:text-sm font-medium whitespace-nowrap text-gray-600">
                                Driver
                            </span>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

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
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-white border-2 border-gray-300"></div>
                        <span className="text-sm text-gray-700">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 border-2 border-green-500 rounded"></div>
                        <span className="text-sm text-gray-700">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 border-2 border-red-300 rounded"></div>
                        <span className="text-sm text-gray-700">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded bg-white border-2 border-gray-300">
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                        </div>
                        <span className="text-sm text-gray-700">Original Seat</span>
                    </div>
                </div>
            </div>
        );
    };

    if (!hasPermission('bookings:read')) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">You don't have permission to view bookings.</div>
                </div>
            </DashboardLayout>
        );
    }

    // Calculate stats
    const stats = {
        total: bookings.length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        revenue: bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0),
        refunded: bookings.filter(b => b.paymentStatus === 'refunded').reduce((sum, b) => sum + b.totalAmount, 0),
        pendingRefunds: bookings.filter(b => canRefund(b)).length
    };

    const filteredStats = {
        total: filteredBookings.length,
        confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
        cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
        revenue: filteredBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0),
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Bookings Management</h1>
                        <div className="text-gray-600">Manage all bookings, refunds and reservations</div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {selectedBookings.length > 0 && hasPermission('bookings:delete') && (
                            <>
                                <Button
                                    onClick={handleBulkCancel}
                                    variant="outline"
                                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Selected ({selectedBookings.length})
                                </Button>
                            </>
                        )}
                        {hasPermission('bookings:write') && (
                            <Button className="bg-primary flex-1 sm:flex-none" onClick={handleCreateBooking}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Booking
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <Card className="rounded-sm border-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{isFilterActive ? filteredStats.total : stats.total}</div>
                            {isFilterActive && (
                                <div className="text-xs text-muted-foreground">Filtered from {stats.total}</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="rounded-sm border-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{isFilterActive ? filteredStats.confirmed : stats.confirmed}</div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-sm border-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                            <CreditCard className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">LKR {(isFilterActive ? filteredStats.revenue : stats.revenue).toLocaleString()}/=</div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-sm border-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Refunded</CardTitle>
                            <RefreshCw className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">LKR {stats.refunded.toLocaleString()}/=</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {stats.pendingRefunds} pending refund eligible
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Section */}
                <Card className="rounded-sm border-none">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                <CardTitle className="text-lg">Filters</CardTitle>
                            </div>
                            {isFilterActive && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="w-4 h-4 mr-1" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Date Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="filterDate">Travel Date</Label>
                                <Input
                                    id="filterDate"
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                    className="w-full"
                                />
                            </div>

                            {/* Route Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="filterRoute">Route</Label>
                                <Select
                                    value={filters.routeId}
                                    onValueChange={handleRouteFilterChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select route" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Routes</SelectItem>
                                        {routes.map((route) => (
                                            <SelectItem key={route._id} value={route._id}>
                                                {route.name} ({route.fromLocation} → {route.toLocation})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bus Filter - Filtered by Route */}
                            <div className="space-y-2">
                                <Label htmlFor="filterBus">
                                    Bus
                                    {filters.routeId && filters.routeId !== 'all' && (
                                        <span className="text-xs text-gray-500 ml-2">
                                            ({filteredBuses.length} available)
                                        </span>
                                    )}
                                </Label>
                                <Select
                                    value={filters.busId}
                                    onValueChange={(value) => setFilters({ ...filters, busId: value })}
                                    disabled={!filters.routeId || filters.routeId === 'all'}
                                >
                                    <SelectTrigger className={!filters.routeId || filters.routeId === 'all' ? 'opacity-50' : ''}>
                                        <SelectValue placeholder={
                                            !filters.routeId || filters.routeId === 'all'
                                                ? "Select a route first"
                                                : "Select bus"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Buses</SelectItem>
                                        {filteredBuses.length === 0 ? (
                                            <SelectItem value="none" disabled>
                                                No buses available for this route
                                            </SelectItem>
                                        ) : (
                                            filteredBuses.map((bus) => (
                                                <SelectItem key={bus._id} value={bus._id}>
                                                    {bus.busNumber} - {bus.departureTime} ({bus.type})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {filters.routeId && filters.routeId !== 'all' && filteredBuses.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        No buses assigned to this route
                                    </p>
                                )}
                            </div>
                        </div>

                        {isFilterActive && (
                            <div className="mt-4 flex items-center justify-between bg-blue-50 p-3 rounded">
                                <div className="text-sm text-blue-800">
                                    Showing {filteredBookings.length} of {bookings.length} bookings
                                    {filters.routeId && filters.routeId !== 'all' && (
                                        <span className="ml-2">
                                            • {filteredBuses.length} bus{filteredBuses.length !== 1 ? 'es' : ''} in route
                                        </span>
                                    )}
                                </div>
                                <Button
                                    onClick={handleGeneratePDF}
                                    disabled={generatingPDF || filteredBookings.length === 0}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {generatingPDF ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF Report
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Search and Bookings Table */}
                <Card className="rounded-sm border-none">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="search"
                                    placeholder="Search by name, phone, or booking ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            {filteredBookings.length > 0 && (
                                <Button
                                    onClick={handleGeneratePDF}
                                    disabled={generatingPDF}
                                    variant="outline"
                                    size="sm"
                                >
                                    {generatingPDF ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Generate Report
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-gray-500">Loading bookings...</div>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                <FileText className="w-12 h-12 mb-2 opacity-50" />
                                <div>No bookings found</div>
                                {isFilterActive && (
                                    <Button variant="link" onClick={clearFilters} className="mt-2">
                                        Clear filters to see all bookings
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {hasPermission('bookings:delete') && (
                                                <TableHead className="w-12">
                                                    <Checkbox
                                                        checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                                                        onCheckedChange={(checked) => handleSelectAllBookings(!!checked)}
                                                        aria-label="Select all bookings"
                                                    />
                                                </TableHead>
                                            )}
                                            <TableHead>Booking ID</TableHead>
                                            <TableHead>Passenger</TableHead>
                                            <TableHead className="hidden md:table-cell">Route</TableHead>
                                            <TableHead className="hidden md:table-cell">Travel Date</TableHead>
                                            <TableHead className="hidden md:table-cell">Status</TableHead>
                                            <TableHead className="hidden md:table-cell">Payment</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBookings.map((booking) => (
                                            <TableRow key={booking._id}>
                                                {hasPermission('bookings:delete') && (
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedBookings.includes(booking._id)}
                                                            onCheckedChange={(checked) => handleSelectBooking(booking._id, !!checked)}
                                                            aria-label={`Select booking ${booking._id}`}
                                                        />
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <div className="font-mono text-xs">
                                                        #{booking._id.slice(-6).toUpperCase()}
                                                    </div>
                                                    {canEditBooking(booking) && (
                                                        <Badge variant="outline" className="text-xs mt-1">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Editable
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{booking.passengerName}</div>
                                                        <div className="text-sm text-gray-500">{booking.passengerPhone}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {typeof booking.routeId === 'object' && (
                                                        <div>
                                                            <div className="font-medium">{booking.routeId.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {booking.routeId.fromLocation} → {booking.routeId.toLocation}
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {format(new Date(booking.travelDate), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <Badge className={getStatusBadgeColor(booking.status)}>
                                                        {booking.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <Badge className={getPaymentBadgeColor(booking.paymentStatus)}>
                                                        {booking.paymentStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Details
                                                            </DropdownMenuItem>

                                                            {hasPermission('bookings:write') && canEditBooking(booking) && (
                                                            <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit Booking
                                                            </DropdownMenuItem>
                                                            )}

                                                            {hasPermission('bookings:write') && booking.status === 'pending' && (
                                                                 <DropdownMenuItem onClick={() => handleConfirmBooking(booking)}>
                                                                     <CheckCircle className="w-4 h-4 mr-2" />
                                                                     Confirm Booking
                                                                 </DropdownMenuItem>
                                                             )}

                                                             {hasPermission('bookings:write') && canRefund(booking) && (
                                                                <DropdownMenuItem onClick={() => handleRefundBooking(booking)}>
                                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                                    Process Refund
                                                                </DropdownMenuItem>
                                                            )}

                                                            {hasPermission('bookings:delete') && booking.status !== 'cancelled' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteBooking(booking)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Cancel Booking
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-gray-500">
                                            Showing {filteredBookings.length} of {totalCount} bookings
                                        </div>
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                    />
                                                </PaginationItem>
                                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                    .filter(page => {
                                                        // Show first page, last page, current page, and pages around current
                                                        return page === 1 ||
                                                            page === totalPages ||
                                                            (page >= currentPage - 1 && page <= currentPage + 1);
                                                    })
                                                    .map((page, index, array) => {
                                                        // Add ellipsis where there are gaps
                                                        const prevPage = array[index - 1];
                                                        if (prevPage && page - prevPage > 1) {
                                                            return (
                                                                <PaginationItem key={`ellipsis-${page}`}>
                                                                    <span className="px-3 py-2">...</span>
                                                                </PaginationItem>
                                                            );
                                                        }
                                                        return (
                                                            <PaginationItem key={page}>
                                                                <PaginationLink
                                                                    onClick={() => handlePageChange(page)}
                                                                    isActive={page === currentPage}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {page}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    })}
                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Booking Details Modal */}
                <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                    <DialogContent className="sm:max-w-[525px] h-[600px] overflow-y-auto bg-sky-100">
                        <DialogHeader>
                            <DialogTitle>Booking Details</DialogTitle>
                            <DialogDescription>
                                Complete booking information
                            </DialogDescription>
                        </DialogHeader>
                        {selectedBooking && (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-500">Booking ID</div>
                                        <div className="font-mono font-medium">#{selectedBooking._id.slice(-6).toUpperCase()}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-500">Status</div>
                                        <div className="flex gap-2">
                                            <Badge className={getStatusBadgeColor(selectedBooking.status)}>
                                                {selectedBooking.status}
                                            </Badge>
                                            <Badge className={getPaymentBadgeColor(selectedBooking.paymentStatus)}>
                                                {selectedBooking.paymentStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-500">Passenger Name</div>
                                        <div className="font-medium">{selectedBooking.passengerName}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-500">Phone</div>
                                        <div className="font-medium">{selectedBooking.passengerPhone}</div>
                                    </div>
                                    {selectedBooking.passengerEmail && (
                                        <div className="space-y-1 col-span-2">
                                            <div className="text-sm text-gray-500">Email</div>
                                            <div className="font-medium">{selectedBooking.passengerEmail}</div>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-500">Travel Date</div>
                                        <div className="font-medium">
                                            {format(new Date(selectedBooking.travelDate), 'dd MMM yyyy')}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-500">Booking Date</div>
                                        <div className="font-medium">
                                            {format(new Date(selectedBooking.bookingDate), 'dd MMM yyyy')}
                                        </div>
                                    </div>
                                    {typeof selectedBooking.routeId === 'object' && (
                                        <div className="space-y-1 col-span-2">
                                            <div className="text-sm text-gray-500">Route</div>
                                            <div className="font-medium">{selectedBooking.routeId.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {selectedBooking.routeId.fromLocation} → {selectedBooking.routeId.toLocation}
                                            </div>
                                        </div>
                                    )}
                                    {typeof selectedBooking.busId === 'object' && (
                                        <div className="space-y-1">
                                            <div className="text-sm text-gray-500">Bus</div>
                                            <div className="font-medium">
                                                {selectedBooking.busId.busNumber} ({selectedBooking.busId.type})
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-500">Seats</div>
                                        <div className="flex gap-1 flex-wrap">
                                            {selectedBooking.seatNumbers.map(seat => (
                                                <Badge key={seat} variant="secondary">
                                                    {seat}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-500">Pickup Location</div>
                                        <div className="font-medium">{selectedBooking.pickupLocation || 'Not specified'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-500">Total Amount</div>
                                        <div className="font-medium text-lg">LKR {selectedBooking.totalAmount.toLocaleString()}/=</div>
                                    </div>
                                    {selectedBooking.notes && (
                                        <div className="space-y-1 col-span-2">
                                            <div className="text-sm text-gray-500">Notes</div>
                                            <div className="font-medium">{selectedBooking.notes}</div>
                                        </div>
                                    )}
                                    {canEditBooking(selectedBooking) && (
                                        <div className="col-span-2 bg-blue-50 p-3 rounded">
                                            <div className="text-sm text-blue-800">
                                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                                This booking is within the 7-day modification period
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button onClick={() => setIsDetailModalOpen(false)} className="bg-gray-500 hover:bg-gray-600">
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Booking Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Booking</DialogTitle>
                            <DialogDescription>
                                Modify booking details. Seat availability will be checked automatically.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedBooking && (
                            <div className="grid gap-4 py-4">
                                <div className="bg-blue-50 p-3 rounded">
                                    <div className="text-sm font-medium">
                                        Booking ID: #{selectedBooking._id.slice(-6).toUpperCase()}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Booked on: {format(new Date(selectedBooking.bookingDate), 'dd MMM yyyy')}
                                    </div>
                                    {canEditBooking(selectedBooking) && (
                                        <div className="text-xs text-green-700 mt-1">
                                            ✓ Within 7-day modification period
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="passengerName">Passenger Name *</Label>
                                            <Input
                                                id="passengerName"
                                                value={editForm.passengerName}
                                                onChange={(e) => setEditForm({ ...editForm, passengerName: e.target.value })}
                                                placeholder="Enter passenger name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="passengerPhone">Phone Number *</Label>
                                            <Input
                                                id="passengerPhone"
                                                value={editForm.passengerPhone}
                                                onChange={(e) => setEditForm({ ...editForm, passengerPhone: e.target.value })}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="passengerEmail">Email (Optional)</Label>
                                        <Input
                                            id="passengerEmail"
                                            type="email"
                                            value={editForm.passengerEmail}
                                            onChange={(e) => setEditForm({ ...editForm, passengerEmail: e.target.value })}
                                            placeholder="Enter email"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="travelDate">Travel Date *</Label>
                                    <Input
                                        id="travelDate"
                                        type="date"
                                        value={editForm.travelDate}
                                        onChange={(e) => handleTravelDateChange(e.target.value)}
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Select Seats *</Label>
                                    <div className="text-sm text-gray-500">
                                        Total Seats: {totalSeats} | Available: {availableSeats.length} | Selected: {editForm.seatNumbers.length} / {selectedBooking?.seatNumbers.length || 0} required
                                    </div>
                                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                                        Original booking had {selectedBooking?.seatNumbers.length} seat{selectedBooking?.seatNumbers.length === 1 ? '' : 's'}. You must select exactly {selectedBooking?.seatNumbers.length} seat{selectedBooking?.seatNumbers.length === 1 ? '' : 's'}.
                                    </div>

                                    {loadingSeats ? (
                                        <div className="flex items-center justify-center h-32 bg-gray-50 rounded">
                                            <div className="text-gray-500">Loading seats...</div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 rounded max-h-96 overflow-y-auto">
                                            {renderSeatLayout()}
                                        </div>
                                    )}


                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pickupLocation">Pickup Location</Label>
                                    <Input
                                        id="pickupLocation"
                                        value={editForm.pickupLocation}
                                        onChange={(e) => setEditForm({ ...editForm, pickupLocation: e.target.value })}
                                        placeholder="Enter pickup location"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Booking Status</Label>
                                        <Select
                                            value={editForm.status}
                                            onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="paymentStatus">Payment Status</Label>
                                        <Select
                                            value={editForm.paymentStatus}
                                            onValueChange={(value: any) => setEditForm({ ...editForm, paymentStatus: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="refunded">Refunded</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={editForm.notes}
                                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                        placeholder="Add any notes or special requests"
                                        rows={3}
                                    />
                                </div>

                                {typeof selectedBooking.routeId === 'object' && (
                                    <div className="bg-green-50 p-3 rounded">
                                        <div className="text-sm font-medium">
                                            Total Amount: LKR {(selectedBooking.routeId.price * editForm.seatNumbers.length).toLocaleString()}/=
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {editForm.seatNumbers.length} seats × LKR {selectedBooking.routeId.price}/=
                                        </div>
                                        {editForm.seatNumbers.length !== selectedBooking.seatNumbers.length && (
                                            <div className="text-xs text-amber-600 mt-1">
                                                ⚠️ Amount will be recalculated based on selected seats
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateBooking}
                                className="bg-primary"
                            >
                                Update Booking
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to cancel this booking
                                {selectedBooking && ` for ${selectedBooking.passengerName}`}?
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDeleteBooking}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Yes, Cancel Booking
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Refund Confirmation Dialog */}
                <AlertDialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Process Refund</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to process a refund for this booking?
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        {selectedBooking && (
                            <div className="space-y-3 py-4">
                                <div className="bg-yellow-50 p-3 rounded">
                                    <p className="text-sm font-medium mb-2">Booking Details:</p>
                                    <div className="space-y-1">
                                        <p className="text-sm">Passenger: {selectedBooking.passengerName}</p>
                                        <p className="text-sm">Amount: LKR {selectedBooking.totalAmount.toLocaleString()}/=</p>
                                        <p className="text-sm">
                                            Booked: {format(new Date(selectedBooking.bookingDate), 'dd MMM yyyy')}
                                        </p>
                                        <p className="text-sm">
                                            Travel Date: {format(new Date(selectedBooking.travelDate), 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    This will change the payment status to "Refunded" and cancel the booking.
                                    The refund amount will be processed within 7 business days.
                                </p>
                            </div>
                        )}

                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmRefund}
                                className="bg-orange-600 hover:bg-orange-700"
                            >
                                Process Refund
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Confirm Booking Dialog */}
                 <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                     <AlertDialogContent>
                         <AlertDialogHeader>
                             <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
                             <AlertDialogDescription>
                                 Are you sure you want to confirm this booking{selectedBooking && ` for ${selectedBooking.passengerName}`}?
                                 This will change the booking status to "confirmed".
                             </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                             <AlertDialogCancel>No, Cancel</AlertDialogCancel>
                             <AlertDialogAction
                                 onClick={confirmBooking}
                                 className="bg-green-600 hover:bg-green-700"
                             >
                                 Yes, Confirm Booking
                             </AlertDialogAction>
                         </AlertDialogFooter>
                     </AlertDialogContent>
                 </AlertDialog>

                 {/* Bulk Action Confirmation Dialog */}
                <AlertDialog open={isBulkActionDialogOpen} onOpenChange={setIsBulkActionDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {bulkActionType === 'cancel' ? 'Cancel Selected Bookings' : 'Delete Selected Bookings'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to {bulkActionType === 'cancel' ? 'cancel' : 'permanently delete'} {selectedBookings.length} selected booking{selectedBookings.length > 1 ? 's' : ''}?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-3 py-4">
                            <div className={`p-3 rounded ${bulkActionType === 'cancel' ? 'bg-orange-50' : 'bg-red-50'}`}>
                                <p className="text-sm font-medium mb-2">This will:</p>
                                <ul className={`text-sm list-disc list-inside space-y-1 ${bulkActionType === 'cancel' ? 'text-orange-700' : 'text-red-700'}`}>
                                    {bulkActionType === 'cancel' ? (
                                        <>
                                            <li>Cancel all selected bookings</li>
                                            <li>Change their status to "cancelled"</li>
                                            <li>Prevent any further modifications</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>Permanently delete all selected bookings</li>
                                            <li>Remove them from the database completely</li>
                                            <li>This action cannot be reversed</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                            <p className="text-sm text-gray-600">
                                {bulkActionType === 'cancel'
                                    ? 'Only bookings that are not already cancelled will be affected.'
                                    : 'This will permanently remove the bookings from the system.'
                                }
                            </p>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={bulkProcessing}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmBulkAction}
                                disabled={bulkProcessing}
                                className={bulkActionType === 'cancel' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}
                            >
                                {bulkProcessing
                                    ? `${bulkActionType === 'cancel' ? 'Cancelling...' : 'Deleting...'}`
                                    : `${bulkActionType === 'cancel' ? 'Cancel' : 'Delete'} ${selectedBookings.length} Booking${selectedBookings.length > 1 ? 's' : ''}`
                                }
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}