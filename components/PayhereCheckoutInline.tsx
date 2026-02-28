'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, Shield, MapPin, Bus, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface PaymentData {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  custom_1?: string;
  custom_2?: string;
}

interface PayhereCheckoutInlineProps {
  paymentData: PaymentData;
  bookingId: string;
  bookingDetails: {
    route: any;
    bus: any;
    formData: any;
    totalAmount: number;
    baseAmount: number;
    serviceFee: number;
  };
}

// Payment state enum
enum PaymentState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR'
}

export default function PayhereCheckoutInline({ paymentData, bookingId, bookingDetails }: PayhereCheckoutInlineProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  
  // State machine for payment status
  const paymentState = useRef<PaymentState>(PaymentState.IDLE);
  const hasNavigated = useRef(false);
  const eventLog = useRef<string[]>([]);

  // Log events for debugging
  const logEvent = (event: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${event}`;
    eventLog.current.push(logEntry);
    console.log(logEntry);
  };

  // Navigate only once
  const navigateOnce = (url: string, reason: string) => {
    if (hasNavigated.current) {
      logEvent(`⚠️ Navigation blocked (already navigated): ${reason}`);
      return;
    }

    hasNavigated.current = true;
    logEvent(`🔄 Navigating to: ${url} - Reason: ${reason}`);
    
    setTimeout(() => {
      router.push(url);
    }, 1500);
  };

  // Check if state transition is allowed
  const canTransitionTo = (newState: PaymentState): boolean => {
    const currentState = paymentState.current;
    
    // Once in a final state, don't allow transitions
    if ([PaymentState.COMPLETED, PaymentState.FAILED, PaymentState.CANCELLED, PaymentState.ERROR].includes(currentState)) {
      logEvent(`⛔ Cannot transition from ${currentState} to ${newState} - final state reached`);
      return false;
    }

    return true;
  };

  // Update payment state
  const updatePaymentState = (newState: PaymentState, event: string) => {
    if (!canTransitionTo(newState)) {
      return false;
    }

    const oldState = paymentState.current;
    paymentState.current = newState;
    logEvent(`🔄 State transition: ${oldState} → ${newState} (${event})`);
    return true;
  };

  const setupPayhereHandlers = useCallback(() => {
    if (!window.payhere) return;

    logEvent('🔧 Setting up PayHere event handlers');

    // ✅ Payment completed successfully
    window.payhere.onCompleted = function (orderId: string) {
      logEvent(`✅ onCompleted fired - Order: ${orderId}`);
      
      // Only accept if we're in PROCESSING state
      if (paymentState.current !== PaymentState.PROCESSING) {
        logEvent(`⚠️ onCompleted ignored - Current state: ${paymentState.current}`);
        return;
      }

      if (updatePaymentState(PaymentState.COMPLETED, 'onCompleted')) {
        setProcessing(false);
        
        toast.success('Payment Completed!', {
          description: 'Verifying your payment and creating booking...',
          duration: 3000,
        });

        navigateOnce(`/payment/success?order_id=${orderId}`, 'Payment completed successfully');
      }
    };

    // ❌ Payment error (insufficient balance, card declined, etc.)
    window.payhere.onError = function (error: string) {
      logEvent(`❌ onError fired - Error: ${error}`);
      
      // Set to ERROR state immediately
      if (updatePaymentState(PaymentState.ERROR, 'onError')) {
        setProcessing(false);
        
        toast.error('Payment Failed', {
          description: error || 'Your payment could not be processed.',
          duration: 5000,
        });

        navigateOnce(
          `/payment/cancel?order_id=${paymentData.order_id}&error=${encodeURIComponent(error)}`,
          'Payment error occurred'
        );
      }
    };

    // ⚠️ Payment dismissed/cancelled by user
    window.payhere.onDismissed = function () {
      logEvent(`⚠️ onDismissed fired - Current state: ${paymentState.current}`);
      
      // If already in ERROR state, don't override
      if (paymentState.current === PaymentState.ERROR) {
        logEvent('ℹ️ onDismissed ignored - already in ERROR state');
        return;
      }

      // If already in COMPLETED state, don't override
      if (paymentState.current === PaymentState.COMPLETED) {
        logEvent('ℹ️ onDismissed ignored - already in COMPLETED state');
        return;
      }

      // Normal cancellation
      if (updatePaymentState(PaymentState.CANCELLED, 'onDismissed')) {
        setProcessing(false);
        
        toast.warning('Payment Cancelled', {
          description: 'You closed the payment window.',
          duration: 4000,
        });

        navigateOnce(
          `/payment/cancel?order_id=${paymentData.order_id}`,
          'User cancelled payment'
        );
      }
    };

  }, [router, paymentData.order_id]);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50;

    const checkPayhere = setInterval(() => {
      attempts++;
      setCheckCount(attempts);

      if (window.payhere) {
        setIsReady(true);
        clearInterval(checkPayhere);
        setupPayhereHandlers();
        logEvent('✅ PayHere SDK loaded and handlers set up');
      } else if (attempts >= maxAttempts) {
        clearInterval(checkPayhere);
        logEvent('❌ PayHere SDK failed to load after max attempts');
        toast.error('Payment gateway failed to load. Please refresh the page.');
      }
    }, 100);

    return () => clearInterval(checkPayhere);
  }, [setupPayhereHandlers]);

  const startPayment = () => {
    if (!window.payhere) {
      toast.error('Payment gateway not ready. Please wait or refresh the page.');
      return;
    }

    // Reset state for new payment attempt
    paymentState.current = PaymentState.PROCESSING;
    hasNavigated.current = false;
    eventLog.current = [];
    
    logEvent('🚀 Starting new payment attempt');
    logEvent(`📋 Order ID: ${paymentData.order_id}`);
    logEvent(`💰 Amount: ${paymentData.currency} ${paymentData.amount}`);

    setProcessing(true);

    try {
      window.payhere.startPayment(paymentData);
      logEvent('✅ PayHere payment modal opened');
    } catch (error) {
      logEvent(`❌ Error starting payment: ${error}`);
      console.error('Failed to start payment:', error);
      setProcessing(false);
      toast.error('Failed to start payment. Please try again.');
    }
  };

  // Debug: Print event log (only in development)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).getPaymentLog = () => {
        console.log('=== Payment Event Log ===');
        eventLog.current.forEach(log => console.log(log));
        console.log('========================');
      };
    }
  }, []);

  if (!isReady) {
    return (
      <Card className="w-full shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-sky-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Loading Payment Gateway
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Please wait while we prepare the payment...
            </p>
            <div className="text-xs text-gray-500">
              Attempt {checkCount}/50
            </div>
            {checkCount > 30 && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-4"
                size="sm"
              >
                Refresh Page
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Card */}
        <div className="lg:col-span-1 lg:order-2">
          <Card className="shadow-xl border-sky-300 lg:sticky lg:top-24">
            <CardHeader className="text-black">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Order ID */}
              <div className="bg-sky-700 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-white mb-1">Order ID</p>
                <p className="font-mono font-semibold text-white text-sm">
                  {paymentData.order_id}
                </p>
              </div>

              {/* Amount Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Fare</span>
                  <span className="font-medium text-gray-800">
                    LKR {bookingDetails.baseAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium text-gray-800">
                    LKR {bookingDetails.serviceFee.toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">Total Amount</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-sky-600">
                        {paymentData.currency} {parseFloat(paymentData.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <Button
                onClick={startPayment}
                disabled={processing || !isReady}
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Opening Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>

              {/* Debug info (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  💡 Open browser console and type <code className="bg-gray-100 px-1 rounded">window.getPaymentLog()</code> to see event log
                </div>
              )}

              {/* Security Notice */}
              <div className="hidden lg:block pt-4 border-t">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800 mb-1">
                      🔒 Secure Payment
                    </p>
                    <p className="text-xs text-gray-600">
                      Encrypted by PayHere. Card details are never stored.
                    </p>
                  </div>
                </div>
              </div>

              {/* PayHere Badge */}
              <div className="pt-4 border-t">
                <div className="flex">
                  <a href="https://www.payhere.lk" target="_blank" rel="noopener noreferrer">
                    <img src="https://www.payhere.lk/downloads/images/payhere_square_banner.png" alt="PayHere" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-2 lg:order-1 space-y-4">
          {/* Journey Details Card */}
          <Card className="shadow-lg border-sky-200">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <MapPin className="w-5 h-5 text-sky-600" />
                Journey Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Route</p>
                    <p className="font-bold text-lg text-gray-800">
                      {bookingDetails.route?.fromLocation} → {bookingDetails.route?.toLocation}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {bookingDetails.route?.name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Bus className="w-4 h-4" />
                      Bus
                    </p>
                    <p className="font-semibold text-gray-800">
                      {bookingDetails.bus?.busNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Travel Date
                    </p>
                    <p className="font-semibold text-gray-800">
                      {new Date(bookingDetails.formData.travelDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Seats
                    </p>
                    <p className="font-semibold text-gray-800">
                      {bookingDetails.formData.seatNumbers.join(', ')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Pickup
                    </p>
                    <p className="font-semibold text-gray-800 text-sm">
                      {bookingDetails.formData.pickupLocation}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passenger Details Card */}
          <Card className="shadow-lg border-sky-200">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Users className="w-5 h-5 text-sky-600" />
                Passenger Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="font-semibold text-gray-800">
                    {bookingDetails.formData.passengerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                  <p className="font-semibold text-gray-800">
                    {bookingDetails.formData.passengerPhone}
                  </p>
                </div>
                {bookingDetails.formData.passengerEmail && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <p className="font-semibold text-gray-800">
                      {bookingDetails.formData.passengerEmail}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Notice - Mobile */}
          <div className="lg:hidden">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-900 mb-1">
                      🔒 100% Secure Payment
                    </p>
                    <p className="text-xs text-green-700">
                      Your payment is encrypted and secured by PayHere. We never store your card details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}