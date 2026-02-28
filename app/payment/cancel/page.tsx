'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, Home, RotateCcw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4 mt-20">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="pt-12 pb-8">
          {/* Cancel Icon */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              Payment Cancelled
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Your payment was not completed
            </p>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mt-4 inline-block">
                Error: {decodeURIComponent(error)}
              </p>
            )}
          </div>

          {/* Order Info */}
          {orderId && (
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 mb-8">
              <p className="text-sm text-gray-600 mb-2 text-center">Order ID</p>
              <p className="text-xl font-mono font-bold text-center text-gray-700">
                {orderId}
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                This order has been cancelled. No booking was created.
              </p>
            </div>
          )}

          {/* What happened */}
          <div className="bg-amber-50 rounded-lg p-6 border-2 border-amber-200 mb-8">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              What happened?
            </h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li>• You closed the payment window before completing the transaction</li>
              <li>• Or there was an error processing your payment</li>
              <li>• No charges were made to your account</li>
              <li>• No booking was created</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push('/booking')}
              className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 h-12"
              size="lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex-1 border-2 border-gray-300 hover:bg-gray-50 h-12"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}