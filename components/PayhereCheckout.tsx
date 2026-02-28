'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

interface PayhereCheckoutProps {
  paymentData: PaymentData;
  bookingId: string;
}

export default function PayhereCheckout({ paymentData, bookingId }: PayhereCheckoutProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Check if PayHere SDK is loaded
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const checkPayhere = setInterval(() => {
      attempts++;
      setCheckCount(attempts);

      if (window.payhere) {
        setIsReady(true);
        clearInterval(checkPayhere);
        setupPayhereHandlers();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkPayhere);
        toast.error('Payment gateway failed to load. Please refresh the page.');
      }
    }, 100);

    return () => clearInterval(checkPayhere);
  }, []);

  const setupPayhereHandlers = useCallback(() => {
    if (!window.payhere) return;

    // Payment completed handler
    window.payhere.onCompleted = function (orderId: string) {
      setProcessing(false);
      
      toast.success('Payment Completed!', {
        description: 'Verifying your payment...',
        duration: 3000,
      });

      // Wait for webhook to process, then redirect
      setTimeout(() => {
        router.push(`/payment/success?order_id=${orderId}`);
      }, 2000);
    };

    // Payment dismissed handler
    window.payhere.onDismissed = function () {
      setProcessing(false);
      
      toast.warning('Payment Cancelled', {
        description: 'You closed the payment window. You can try again.',
      });
    };

    // Error handler
    window.payhere.onError = function (error: string) {
      setProcessing(false);
      
      toast.error('Payment Error', {
        description: error || 'An error occurred during payment. Please try again.',
      });
    };

  }, [router]);

  const startPayment = () => {
    if (!window.payhere) {
      toast.error('Payment gateway not ready. Please wait or refresh the page.');
      return;
    }

    setProcessing(true);

    try {
      window.payhere.startPayment(paymentData);
    } catch (error) {
      setProcessing(false);
      toast.error('Failed to start payment. Please try again.');
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-50 to-white">
        <Card className="max-w-md w-full">
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
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-50 to-white p-4 mt-20">
      <Card className="max-w-lg w-full shadow-xl">
        <CardContent className="pb-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Complete Your Payment
            </h1>
            <p className="text-gray-600">
              Click the button below to proceed with secure payment
            </p>
          </div>

          {/* Payment Details */}
          <div className="space-y-3 mb-6">
            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Order ID</span>
                <span className="font-mono font-semibold text-gray-800 text-sm">
                  {paymentData.order_id}
                </span>
              </div>
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Service</span>
                <span className="font-semibold text-gray-800 text-sm text-right max-w-[60%]">
                  {paymentData.items}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-sky-600">
                  {paymentData.currency} {parseFloat(paymentData.amount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
              <p className="text-sm text-gray-700 mb-3 font-semibold">Passenger Details</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {paymentData.first_name} {paymentData.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {paymentData.phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-semibold text-gray-800 truncate ml-2">
                    {paymentData.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pickup:</span>
                  <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">
                    {paymentData.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900 mb-1">
                    🔒 Secure Payment Guaranteed
                  </p>
                  <p className="text-xs text-green-700">
                    Your payment is secured and encrypted by PayHere. We never store your card details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={startPayment}
            disabled={processing || !isReady}
            className="w-full bg-sky-600 hover:bg-sky-700 h-14 text-lg font-semibold mb-4 shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Opening Payment Gateway...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay {paymentData.currency} {parseFloat(paymentData.amount).toFixed(2)}
              </>
            )}
          </Button>

          {/* Back Button */}
          <Button
            onClick={() => router.push('/booking')}
            variant="outline"
            className="w-full h-12"
            disabled={processing}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel & Go Back
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}