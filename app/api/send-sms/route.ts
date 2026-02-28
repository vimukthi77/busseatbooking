import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

const SEND_LK_API_URL = 'https://sms.send.lk/api/v3/sms/send';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== SMS REQUEST STARTED ===');
    
    let { to, message } = body;

    if (!to || !message) {
      console.error('❌ Missing required fields');
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Missing required fields: to, message'
      }, { status: 400 });
    }

    const apiToken = process.env.SEND_LK_API_TOKEN;
    const senderId = process.env.SEND_LK_SENDER_ID;

    console.log('Environment check:');
    console.log('- API Token exists:', !!apiToken);
    console.log('- API Token preview:', apiToken ? `${apiToken.substring(0, 15)}...` : 'NOT SET');
    console.log('- Sender ID:', senderId || 'NOT SET');

    if (!apiToken) {
      console.error('❌ Missing SEND_LK_API_TOKEN');
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Server configuration error: Missing API token'
      }, { status: 500 });
    }

    if (!senderId) {
      console.error('❌ Missing SEND_LK_SENDER_ID');
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Server configuration error: Missing Sender ID. Please add SEND_LK_SENDER_ID to .env.local with an APPROVED sender ID from your send.lk dashboard.'
      }, { status: 500 });
    }

    // Clean and format phone number
    let recipient = to.replace(/\s/g, '').replace(/-/g, '');
    
    // Try different phone number formats
    const phoneFormats = [
      recipient.replace(/\+/g, ''), // Without +
      recipient, // With + if present
      recipient.startsWith('0') ? '94' + recipient.substring(1) : recipient, // 0714310048 -> 94714310048
      recipient.startsWith('94') ? recipient : '94' + recipient, // Add 94 prefix
    ];

    // Use the first valid format (remove duplicates)
    recipient = [...new Set(phoneFormats)][0];

    console.log('SMS Details:');
    console.log('- Original number:', to);
    console.log('- Formatted recipient:', recipient);
    console.log('- Sender ID:', senderId);
    console.log('- Message length:', message.length, 'chars');

    // Try Method 1: POST with JSON body
    console.log('\n--- Attempting Method 1: POST with JSON ---');
    try {
      const jsonResponse = await fetch(SEND_LK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: recipient,
          sender_id: senderId,
          message: message
        })
      });

      const jsonResponseText = await jsonResponse.text();
      console.log('Method 1 Response:', jsonResponseText);

      let jsonData;
      try {
        jsonData = JSON.parse(jsonResponseText);
      } catch (e) {
        console.log('Method 1: Not valid JSON');
      }

      if (jsonData && jsonData.status === 'success') {
        console.log('✅ Method 1 SUCCESS');
        return NextResponse.json<ApiResponse>({
          success: true,
          message: 'SMS sent successfully',
          data: jsonData.data
        });
      }

      console.log('Method 1 failed, trying Method 2...');
    } catch (error) {
      console.log('Method 1 error:', error);
    }

    // Try Method 2: POST with URL-encoded form data
    console.log('\n--- Attempting Method 2: POST with Form Data ---');
    const formData = new URLSearchParams();
    formData.append('recipient', recipient);
    formData.append('sender_id', senderId);
    formData.append('message', message);

    console.log('Form data:', formData.toString());

    const formResponse = await fetch(SEND_LK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    console.log('Method 2 Response status:', formResponse.status, formResponse.statusText);
    
    const formResponseText = await formResponse.text();
    console.log('Method 2 Response body:', formResponseText);

    let formData2;
    try {
      formData2 = JSON.parse(formResponseText);
    } catch (e) {
      console.error('❌ Failed to parse JSON response');
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid response from SMS provider',
        data: { rawResponse: formResponseText }
      }, { status: 500 });
    }

    if (formData2.status === 'success') {
      console.log('✅ Method 2 SUCCESS');
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'SMS sent successfully',
        data: formData2.data
      });
    } else {
      // Parse error message
      let errorMessage = formData2.message || 'Failed to send SMS';
      
      // Provide helpful error messages
      if (errorMessage.includes('invalid') || errorMessage.includes('data was invalid')) {
        errorMessage = `Invalid request data. Common causes:
1. Sender ID "${senderId}" is NOT APPROVED in your send.lk account
2. Recipient number format issue
3. Insufficient credits

Please check:
- Login to send.lk dashboard
- Go to "Sender IDs" section
- Make sure "${senderId}" status is APPROVED (green checkmark)
- Or create and approve a new Sender ID`;
      }

      console.error('❌ All methods failed');
      console.error('Error:', errorMessage);
      console.error('Full response:', formData2);

      return NextResponse.json<ApiResponse>({
        success: false,
        message: errorMessage,
        data: formData2
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Exception in /api/send-sms:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: error instanceof Error ? error.message : 'Internal Server Error'
    }, { status: 500 });
  } finally {
    console.log('=== SMS REQUEST ENDED ===\n');
  }
}