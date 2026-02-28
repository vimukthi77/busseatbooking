'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, Home, Calendar, MapPin, Bus, Users, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const BOOKING_FEE = 100;
const MAX_POLLING_ATTEMPTS = 5; // Poll for up to 5 seconds
const POLLING_INTERVAL = 1000; // Check every 1 second

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pollingAttempts, setPollingAttempts] = useState(0);

  useEffect(() => {
    if (!orderId) {
      toast.error('Invalid order ID');
      router.push('/booking');
      return;
    }

    // Start polling for booking
    pollForBooking();
  }, [orderId]);

  const pollForBooking = async () => {
  let attempts = 0;
  
  const poll = async () => {
    try {
      attempts++;
      setPollingAttempts(attempts);
      
      console.log(`🔄 [${attempts}/${MAX_POLLING_ATTEMPTS}] Polling for booking - Order: ${orderId}`);

      const response = await fetch(`/api/public/booking?orderId=${orderId}`);
      const data = await response.json();

      console.log(`📡 Response status: ${response.status}`, data);

      if (data.success && data.data) {
        console.log('✅ Booking found!', {
          bookingId: data.data._id,
          status: data.data.status,
          paymentStatus: data.data.paymentStatus
        });
          
          // Booking found - send SMS if not already sent
          if (!data.data.sendSms) {
            await sendSMS(data.data);
            
            // Update booking to mark SMS as sent
            const updateResponse = await fetch(`/api/public/booking?orderId=${orderId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sendSms: true })
            });
            
            if (updateResponse.ok) {
              const updatedData = await updateResponse.json();
              setBooking(updatedData.data);
            } else {
              setBooking(data.data);
            }
          } else {
            setBooking(data.data);
          }
          
          setLoading(false);
          return true; // Stop polling
        }

        // If booking not found yet and haven't exceeded max attempts
        if (attempts < MAX_POLLING_ATTEMPTS) {
          setTimeout(poll, POLLING_INTERVAL);
        } else {
          // Max attempts reached - check payment status and create booking if needed
          console.log('❌ Booking not found after max polling attempts - checking payment status...');
          await checkPaymentAndCreateBooking();
        }
      } catch (error) {
        console.error('Error polling for booking:', error);
        
        if (attempts < MAX_POLLING_ATTEMPTS) {
          setTimeout(poll, POLLING_INTERVAL);
        } else {
          setError('Failed to fetch booking details. Please contact support with your order ID: ' + orderId);
          setLoading(false);
        }
      }
    };

    poll();
  };

  const checkPaymentAndCreateBooking = async () => {
    try {
      console.log('🔍 Checking payment status for order:', orderId);

      // Fetch payment status
      const paymentResponse = await fetch(`/api/payments/status?orderId=${orderId}`);
      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        console.error('❌ Payment not found:', orderId);
        setError('Payment record not found. Please contact support with your order ID: ' + orderId);
        setLoading(false);
        return;
      }

      const payment = paymentData.data;
      console.log('📊 Payment status:', payment.status);

      if (payment.status === 'completed' || payment.status === 'pending') {
        // Payment successful (or assume successful since redirected to success page)
        if (payment.status === 'pending') {
          // Update payment status to completed for sandbox testing
          console.log('🔄 Updating payment status to completed...');
          await fetch(`/api/payments/status?orderId=${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed', statusCode: '2' })
          });
        }

        console.log('✅ Payment completed - attempting to create booking...');

        const createBookingResponse = await fetch('/api/bookings/create-from-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });

        const createResult = await createBookingResponse.json();

        if (createResult.success) {
          console.log('✅ Booking created successfully');
          // Now poll again for the booking
          pollForBooking();
        } else {
          console.error('❌ Failed to create booking:', createResult.message);
          setError('Payment successful but booking creation failed. Please contact support with order ID: ' + orderId);
          setLoading(false);
        }
      } else if (payment.status === 'failed') {
        console.error('❌ Payment failed');
        setError('Payment failed. Please try again or contact support.');
        setLoading(false);
      } else {
        // Payment still pending
        console.log('⏳ Payment still pending');
        setError('Your payment is still being processed. Please check again in a few minutes or contact support.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking payment and creating booking:', error);
      setError('Failed to check payment status. Please contact support with your order ID: ' + orderId);
      setLoading(false);
    }
  };

  const sendSMS = async (booking: any) => {
    try {
      const formatDepartureTime = (time: string) => {
        if (!time) return 'Not Set';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      };

      const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-CA');
      };

      const message = `Hi,
Welcome to Bus Seat Booking!

Transaction ID: ${booking._id.slice(-8).toUpperCase()}
Journey Date: ${formatDate(booking.travelDate)}
Seats: ${booking.seatNumbers.join(',')}
Pick-Up Location: ${booking.pickupLocation}
Drop-Off Location: ${booking.routeId?.toLocation}
Bus No: ${booking.busId?.busNumber}
Bus Departure Time: ${formatDepartureTime(booking.busId?.departureTime)}
Bus Hotline No: ${booking.busId?.contactNumber || '+94725787878'}

Each seat is allowed with 1 bag and 1 luggage.

Please arrive at the bus stop 15 minutes before the bus departure.

For Online Seat Reservation: busseatbooking.com

For inquiries: +94724151515

Thank you and have a safe journey!`;

      console.log('📱 Sending SMS...');

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: booking.passengerPhone,
          message: message,
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ SMS sent successfully');
        toast.success('📱 Booking confirmation SMS sent!');
      } else {
        console.error('❌ Failed to send SMS:', data.message);
        toast.warning('Booking confirmed but SMS notification failed.');
      }
    } catch (error) {
      console.error('SMS error:', error);
      toast.warning('Booking confirmed but SMS notification failed.');
    }
  };

  const generateSummaryPDF = (booking: any) => {
    try {      
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast.error('Please allow popups to download the summary');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Booking Summary - ${booking._id.slice(-8).toUpperCase()}</title>
            <style>
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
              .header h1 { color: #1e40af; margin: 0 0 10px 0; }
              .header h2 { color: #64748b; margin: 0; font-weight: normal; }
              .summary { border: 2px solid #e2e8f0; padding: 30px; max-width: 700px; margin: 0 auto; border-radius: 8px; background: #f8fafc; }
              .row { display: flex; justify-content: space-between; margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
              .row:last-child { border-bottom: none; }
              .label { font-weight: bold; color: #475569; }
              .value { color: #1e293b; text-align: right; }
              .total-row { background: #dbeafe; padding: 15px; margin-top: 20px; border-radius: 5px; font-size: 18px; font-weight: bold; }
              @media print { body { padding: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🚌 Bus Seat Booking Summary</h1>
              <h2>Booking ID: ${booking._id.slice(-8).toUpperCase()}</h2>
            </div>
            <div class="summary">
              <div class="row">
                <span class="label">Route:</span>
                <span class="value">${booking.routeId?.fromLocation} → ${booking.routeId?.toLocation}</span>
              </div>
              <div class="row">
                <span class="label">Bus Number:</span>
                <span class="value">${booking.busId?.busNumber}</span>
              </div>
              <div class="row">
                <span class="label">Travel Date:</span>
                <span class="value">${new Date(booking.travelDate).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}</span>
              </div>
              <div class="row">
                <span class="label">Seat Number(s):</span>
                <span class="value">${booking.seatNumbers.join(', ')}</span>
              </div>
              <div class="row">
                <span class="label">Pickup Location:</span>
                <span class="value">${booking.pickupLocation}</span>
              </div>
              <div class="row">
                <span class="label">Passenger Name:</span>
                <span class="value">${booking.passengerName}</span>
              </div>
              <div class="row">
                <span class="label">Phone:</span>
                <span class="value">${booking.passengerPhone}</span>
              </div>
              ${booking.passengerEmail ? `
                <div class="row">
                  <span class="label">Email:</span>
                  <span class="value">${booking.passengerEmail}</span>
                </div>
              ` : ''}
              <div class="row total-row">
                <span class="label">Total Amount:</span>
                <span class="value">LKR ${booking.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      toast.success('Opening print dialog...');
    } catch (error) {
      toast.error('Failed to generate summary');
    }
  };

  const generateTicketPDF = (booking: any) => {
    try {
      const formatDepartureTime = (time: string) => {
        if (!time) return 'Not Set';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      };

      if (!booking || !booking._id || !booking.routeId || !booking.busId) {
        toast.error('Unable to generate ticket - invalid booking data');
        return;
      }

      toast.info('Generating your ticket...');

      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast.error('Please allow popups to download the ticket');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bus Ticket - ${booking._id.slice(-8).toUpperCase()}</title>
            <meta charset="UTF-8">
            <style>
              @page { size: A4; margin: 0; }
              * { box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
              .ticket-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden; }
              .ticket-header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px 20px; text-align: center; position: relative; }
              .ticket-header h1 { margin: 0; font-size: 32px; font-weight: bold; }
              .ticket-header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
              .ticket-body { padding: 30px; }
              .booking-id { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px; }
              .booking-id-label { font-size: 14px; color: #64748b; margin-bottom: 8px; }
              .booking-id-text { font-size: 24px; font-weight: bold; color: #1e40af; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 2px; }
              .route-section { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; padding: 25px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #3b82f6; }
              .route-from, .route-to { text-align: center; flex: 1; }
              .route-from h3, .route-to h3 { margin: 0; font-size: 22px; color: #1e293b; }
              .route-from p, .route-to p { margin: 8px 0 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600; }
              .arrow { font-size: 28px; color: #3b82f6; margin: 0 20px; font-weight: bold; }
              .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
              .detail-card { background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; }
              .detail-card h4 { margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
              .detail-card p { margin: 0; font-size: 18px; font-weight: bold; color: #1e293b; }
              .passenger-info { background: #f8fafc; border-radius: 8px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
              .passenger-info h3 { margin: 0 0 20px 0; color: #1e293b; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
              .passenger-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
              .passenger-detail { padding: 10px 0; }
              .passenger-detail-label { font-weight: 600; color: #64748b; font-size: 13px; margin-bottom: 5px; }
              .passenger-detail-value { font-weight: bold; color: #1e293b; font-size: 16px; }
              .important-notes { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 25px; margin-bottom: 30px; }
              .important-notes h4 { margin: 0 0 15px 0; color: #92400e; font-size: 18px; display: flex; align-items: center; gap: 8px; }
              .important-notes ul { margin: 0; padding-left: 20px; color: #92400e; }
              .important-notes li { margin-bottom: 8px; line-height: 1.5; }
              .ticket-footer { text-align: center; padding: 25px 20px; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; }
              .ticket-footer p { margin: 8px 0; font-size: 14px; }
              .barcode-section { text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
              .barcode { display: inline-block; background: #f8fafc; color: black; padding: 15px 30px; border: 2px dashed #cbd5e1; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; letter-spacing: 4px; }
              @media print { body { background: white; padding: 0; } .ticket-container { box-shadow: none; } }
            </style>
          </head>
          <body>
            <div class="ticket-container">
              <div class="ticket-header">
                <h1>🚌 Bus Seat Booking</h1>
                <p>Safe & Comfortable Journey</p>
              </div>
              <div class="ticket-body">
                <div class="booking-id">
                  <div class="booking-id-label">BOOKING ID</div>
                  <p class="booking-id-text">${booking._id.slice(-8).toUpperCase()}</p>
                </div>
                <div class="route-section">
                  <div class="route-from">
                    <h3>${booking.routeId?.fromLocation}</h3>
                    <p>Departure</p>
                  </div>
                  <div class="arrow">→</div>
                  <div class="route-to">
                    <h3>${booking.routeId?.toLocation}</h3>
                    <p>Destination</p>
                  </div>
                </div>
                <div class="details-grid">
                  <div class="detail-card">
                    <h4>🚌 Bus Number</h4>
                    <p>${booking.busId?.busNumber}</p>
                  </div>
                  <div class="detail-card">
                    <h4>📅 Travel Date</h4>
                    <p>${new Date(booking.travelDate).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}</p>
                  </div>
                  <div class="detail-card">
                    <h4>⏰ Departure Time</h4>
                    <p>${formatDepartureTime(booking.busId?.departureTime)}</p>
                  </div>
                  <div class="detail-card">
                    <h4>💺 Seat Number(s)</h4>
                    <p>${booking.seatNumbers.join(', ')}</p>
                  </div>
                </div>
                <div class="passenger-info">
                  <h3>👤 Passenger Information</h3>
                  <div class="passenger-details">
                    <div class="passenger-detail">
                      <div class="passenger-detail-label">Full Name</div>
                      <div class="passenger-detail-value">${booking.passengerName}</div>
                    </div>
                    <div class="passenger-detail">
                      <div class="passenger-detail-label">Phone Number</div>
                      <div class="passenger-detail-value">${booking.passengerPhone}</div>
                    </div>
                    <div class="passenger-detail">
                      <div class="passenger-detail-label">Pickup Location</div>
                      <div class="passenger-detail-value">${booking.pickupLocation}</div>
                    </div>
                  </div>
                </div>
                <div class="important-notes">
                  <h4>⚠️ Important Information</h4>
                  <ul>
                    <li><strong>Arrival Time:</strong> Please arrive at the pickup point 15 minutes before departure time</li>
                    <li><strong>Luggage:</strong> Each seat is allowed with 1 bag and 1 luggage</li>
                  </ul>
                </div>
                <div class="barcode-section">
                  <div class="barcode">${booking._id.slice(-8).toUpperCase()}</div>
                </div>
              </div>
              <div class="ticket-footer">
                <p><strong>📞 For inquiries:</strong> +94724151515</p>
                <p><strong>🌐 Online booking:</strong> busseatbooking.com</p>
                <p style="margin-top: 15px; font-size: 16px;">Thank you for choosing Bus Seat Booking. Have a safe journey! 🚍</p>
              </div>
            </div>
            <script>
              window.onload = function() { setTimeout(function() { window.print(); }, 500); };
              window.onafterprint = function() { setTimeout(function() { window.close(); }, 1000); };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      toast.success('Opening ticket for download...');
      
    } catch (error) {
      toast.error('Failed to generate ticket');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-sky-50 flex items-center justify-center p-4 mt-20">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="pt-12 pb-8">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-sky-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Your Booking...</h2>
              <p className="text-gray-600 mb-4">
                Please wait while we confirm your payment and create your booking.
              </p>
              <p className="text-sm text-gray-500">
                Attempt {pollingAttempts}/{MAX_POLLING_ATTEMPTS}
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Processing Payment...</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
              <div className="bg-sky-50 border-2 border-sky-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="text-sm text-sky-800 font-semibold">Order ID:</p>
                <p className="text-lg font-mono font-bold text-sky-600">{orderId}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.location.reload()} variant="default">
                  Check Again
                </Button>
                <Button onClick={() => router.push('/')} variant="outline">
                  Go to Homepage
                </Button>
              </div>
            </div>
          )}

          {/* Success State */}
          {!loading && !error && booking && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                  Payment Successful! 🎉
                </h1>
                <p className="text-lg text-gray-600 mb-2">
                  Your booking has been confirmed
                </p>
                <p className="text-sm text-gray-500">
                  A confirmation SMS has been sent to {booking.passengerPhone}
                </p>
              </div>

              <div className="space-y-6 mb-8">
                {/* Order ID */}
                <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-6 border-2 border-sky-200">
                  <p className="text-sm text-gray-600 mb-2 text-center">Booking ID</p>
                  <p className="text-2xl font-mono font-bold text-center text-sky-600">
                    #{booking._id.slice(-8).toUpperCase()}
                  </p>
                </div>

                {/* Journey Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <p className="text-sm">Route</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {booking.routeId?.fromLocation} → {booking.routeId?.toLocation}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Bus className="w-4 h-4" />
                      <p className="text-sm">Bus</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {booking.busId?.busNumber}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <p className="text-sm">Travel Date</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {new Date(booking.travelDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Users className="w-4 h-4" />
                      <p className="text-sm">Seats</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {booking.seatNumbers.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap justify-center gap-3">
                  <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-2 text-sm">
                    ✅ Booking Completed
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300 px-4 py-2 text-sm">
                    💳 Payment Confirmed
                  </Badge>
                </div>

                {/* Important Info */}
                <div className="bg-amber-50 rounded-lg p-6 border-2 border-amber-200">
                  <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    ⚠️ Important Information
                  </h3>
                  <ul className="space-y-2 text-sm text-amber-800">
                    <li>• Please arrive at the pickup point 15 minutes before departure</li>
                    <li>• Carry a valid ID proof for verification</li>
                    <li>• Show this booking ID to the bus conductor</li>
                    <li>• Pickup Location: <strong>{booking.pickupLocation}</strong></li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => router.push('/')}
                  className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 h-12"
                  size="lg"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Go to Homepage
                </Button>
                <Button
                  onClick={() => generateSummaryPDF(booking)}
                  variant="outline"
                  className="flex-1 border-2 border-sky-300 hover:bg-sky-50 h-12"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Summary
                </Button>
                <Button
                  onClick={() => generateTicketPDF(booking)}
                  variant="outline"
                  className="flex-1 border-2 border-green-300 hover:bg-green-50 text-green-700 hover:text-green-800 h-12"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Ticket
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}