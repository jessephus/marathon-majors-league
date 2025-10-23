/**
 * SMS Service
 * 
 * Handles SMS delivery for authentication (OTP codes).
 * Supports multiple providers: Twilio, AWS SNS
 */

/**
 * Send an SMS using the configured SMS service
 * @param {Object} options - SMS options
 * @param {string} options.to - Recipient phone number (E.164 format: +1234567890)
 * @param {string} options.message - SMS message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendSMS({ to, message }) {
  const provider = process.env.SMS_SERVICE_PROVIDER;
  
  if (!provider) {
    console.error('SMS_SERVICE_PROVIDER not configured');
    return { 
      success: false, 
      error: 'SMS service not configured. Please set SMS_SERVICE_PROVIDER environment variable.' 
    };
  }
  
  try {
    switch (provider.toLowerCase()) {
      case 'twilio':
        return await sendViaTwilio(to, message);
      
      case 'sns':
      case 'aws-sns':
        return await sendViaSNS(to, message);
      
      default:
        console.error(`Unsupported SMS provider: ${provider}`);
        return { 
          success: false, 
          error: `Unsupported SMS provider: ${provider}. Supported: twilio, sns` 
        };
    }
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(to, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
  }
  
  if (!fromNumber) {
    throw new Error('TWILIO_PHONE_NUMBER not configured');
  }
  
  // Create Basic Auth header
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Twilio error: ${errorData.message || response.statusText}`);
  }
  
  const data = await response.json();
  return { success: true, messageId: data.sid };
}

/**
 * Send SMS via AWS SNS
 */
async function sendViaSNS(to, message) {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
  }
  
  // Note: This is a simplified implementation
  // In production, use AWS SDK or a proper SNS client
  console.warn('AWS SNS integration requires AWS SDK. Using mock response.');
  
  return { 
    success: false, 
    error: 'AWS SNS requires AWS SDK to be installed. Please install @aws-sdk/client-sns.' 
  };
}

// ============================================================================
// SMS Templates
// ============================================================================

/**
 * Generate OTP SMS message
 */
export function generateOTPSMS(otpCode) {
  return `Your Marathon Majors League verification code is: ${otpCode}. This code expires in 5 minutes.`;
}

/**
 * Generate login verification SMS
 */
export function generateLoginSMS(otpCode) {
  return `Your login code for Marathon Majors League is: ${otpCode}. Valid for 5 minutes.`;
}

/**
 * Generate phone verification SMS
 */
export function generatePhoneVerificationSMS(otpCode) {
  return `Verify your phone for Marathon Majors League. Code: ${otpCode}. Expires in 5 minutes.`;
}
