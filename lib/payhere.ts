import crypto from 'crypto';

// PayHere Configuration
export const payhereConfig = {
  merchantId: process.env.PAYHERE_MERCHANT_ID!,
  merchantSecret: process.env.PAYHERE_MERCHANT_SECRET!,
  
  // 🔴 PRODUCTION: Change 'sandbox' to 'live'
  mode: process.env.PAYHERE_MODE || 'live', // Change to 'live' for production
  
  currency: process.env.PAYHERE_CURRENCY || 'LKR',
  
  // These URLs MUST match your registered domain in PayHere Portal
  appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
};

/**
 * Generate PayHere hash for payment
 */
export function generatePayhereHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  merchantSecret: string
): string {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret.trim())
    .digest('hex')
    .toUpperCase();

  const amountFormatted = parseFloat(amount).toFixed(2);
  const hashString = `${merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`;

  const finalHash = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();

  return finalHash;
}

/**
 * Verify PayHere webhook hash
 */
export function verifyPayhereHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  statusCode: string,
  md5sig: string,
  merchantSecret: string
): boolean {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret.trim())
    .digest('hex')
    .toUpperCase();

  const amountFormatted = parseFloat(amount).toFixed(2);
  const hashString = `${merchantId}${orderId}${amountFormatted}${currency}${statusCode}${hashedSecret}`;

  const generatedHash = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();

  return generatedHash === md5sig;
}