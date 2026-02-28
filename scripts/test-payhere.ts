import crypto from 'crypto';

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || 'YOUR_MERCHANT_ID';
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || 'YOUR_SECRET';

function testPayhereHash() {
  console.log('=== PayHere Configuration Test ===\n');
  
  console.log('Merchant ID:', MERCHANT_ID);
  console.log('Merchant Secret:', MERCHANT_SECRET ? '***' + MERCHANT_SECRET.slice(-4) : 'NOT SET');
  console.log('');

  // Test values
  const orderId = 'TEST123456';
  const amount = '1000.00';
  const currency = 'LKR';

  // Step 1: Hash the secret
  const hashedSecret = crypto
    .createHash('md5')
    .update(MERCHANT_SECRET)
    .digest('hex')
    .toUpperCase();

  console.log('Step 1 - Hashed Secret:', hashedSecret);

  // Step 2: Create hash string
  const hashString = `${MERCHANT_ID}${orderId}${amount}${currency}${hashedSecret}`;
  console.log('Step 2 - Hash String:', hashString);

  // Step 3: Generate final hash
  const finalHash = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();

  console.log('Step 3 - Final Hash:', finalHash);
  console.log('\n=== Test Complete ===');

  // Sample PayHere data
  console.log('\nSample Payment Data:');
  console.log(JSON.stringify({
    merchant_id: MERCHANT_ID,
    order_id: orderId,
    amount: amount,
    currency: currency,
    hash: finalHash,
    items: 'Test Item',
    first_name: 'John',
    last_name: 'Doe',
  }, null, 2));
}

testPayhereHash();