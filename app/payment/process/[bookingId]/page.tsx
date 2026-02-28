'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PayhereCheckout from '@/components/PayhereCheckout';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentProcessPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initializePayment();
  }, [bookingId]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Initializing payment for booking:', bookingId);
      
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      console.log('📦 Response:', data);

      if (data.success) {
        setPaymentData(data.data.paymentData);
      } else {
        setError(data.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('❌ Payment initialization error:', err);
      setError('An error occurred while initializing payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-50 to-white">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-sky-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Initializing Payment</h2>
            <p className="text-gray-600 text-sm">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-white p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
              <Button 
                onClick={() => {
                  initialized.current = false;
                  initializePayment();
                }} 
                className="flex-1 bg-sky-600 hover:bg-sky-700"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return <PayhereCheckout paymentData={paymentData} bookingId={bookingId} />;
}