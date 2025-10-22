/**
 * Email Service
 * 
 * Handles email delivery for authentication and notifications.
 * Supports multiple providers: SendGrid, AWS SES, Resend
 */

/**
 * Send an email using the configured email service
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendEmail({ to, subject, text, html }) {
  const provider = process.env.EMAIL_SERVICE_PROVIDER;
  
  if (!provider) {
    console.error('EMAIL_SERVICE_PROVIDER not configured');
    return { 
      success: false, 
      error: 'Email service not configured. Please set EMAIL_SERVICE_PROVIDER environment variable.' 
    };
  }
  
  try {
    switch (provider.toLowerCase()) {
      case 'sendgrid':
        return await sendViaWe(to, subject, text, html);
      
      case 'ses':
      case 'aws-ses':
        return await sendViaSES(to, subject, text, html);
      
      case 'resend':
        return await sendViaResend(to, subject, text, html);
      
      default:
        console.error(`Unsupported email provider: ${provider}`);
        return { 
          success: false, 
          error: `Unsupported email provider: ${provider}. Supported: sendgrid, ses, resend` 
        };
    }
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(to, subject, text, html) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME || 'Marathon Majors League';
  
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }
  
  if (!fromAddress) {
    throw new Error('EMAIL_FROM_ADDRESS not configured');
  }
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }]
      }],
      from: { 
        email: fromAddress,
        name: fromName
      },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid error: ${response.status} - ${errorText}`);
  }
  
  return { 
    success: true, 
    messageId: response.headers.get('x-message-id') 
  };
}

/**
 * Send email via AWS SES
 */
async function sendViaSES(to, subject, text, html) {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME || 'Marathon Majors League';
  
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured');
  }
  
  if (!fromAddress) {
    throw new Error('EMAIL_FROM_ADDRESS not configured');
  }
  
  // Note: This is a simplified implementation
  // In production, use AWS SDK or a proper SES client
  console.warn('AWS SES integration requires AWS SDK. Using mock response.');
  
  return { 
    success: false, 
    error: 'AWS SES requires AWS SDK to be installed. Please install @aws-sdk/client-ses.' 
  };
}

/**
 * Send email via Resend
 */
async function sendViaResend(to, subject, text, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME || 'Marathon Majors League';
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }
  
  if (!fromAddress) {
    throw new Error('EMAIL_FROM_ADDRESS not configured');
  }
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      subject,
      text,
      html
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return { success: true, messageId: data.id };
}

// ============================================================================
// Email Templates
// ============================================================================

/**
 * Generate magic link email
 */
export function generateMagicLinkEmail(email, token, purpose = 'login') {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const magicLink = `${appUrl}/auth/verify?token=${token}`;
  
  const purposeText = {
    login: 'sign in to your account',
    verify_email: 'verify your email address',
    reset_totp: 'reset your TOTP authentication',
    invite: 'accept your invitation'
  }[purpose] || 'authenticate';
  
  const subject = `Your Magic Link for Marathon Majors League`;
  
  const text = `
Hi there,

Click the link below to ${purposeText}:

${magicLink}

This link will expire in 15 minutes for security purposes.

If you didn't request this link, you can safely ignore this email.

Thanks,
Marathon Majors League Team
  `.trim();
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Magic Link</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF6B35 0%, #004E89 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Marathon Majors League</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">
      Click the button below to <strong>${purposeText}</strong>:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}" style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        ${purpose === 'login' ? 'Sign In' : 'Verify Email'}
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 25px;">
      Or copy and paste this link into your browser:<br>
      <a href="${magicLink}" style="color: #004E89; word-break: break-all;">${magicLink}</a>
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
      This link will expire in <strong>15 minutes</strong> for security purposes.
    </p>
    
    <p style="font-size: 14px; color: #999; margin-top: 20px;">
      If you didn't request this link, you can safely ignore this email.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Thanks,<br>
      <strong>Marathon Majors League Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
  
  return { subject, text, html };
}

/**
 * Generate OTP email
 */
export function generateOTPEmail(email, otpCode) {
  const subject = `Your verification code: ${otpCode}`;
  
  const text = `
Hi there,

Your verification code is: ${otpCode}

This code will expire in 5 minutes.

If you didn't request this code, you can safely ignore this email.

Thanks,
Marathon Majors League Team
  `.trim();
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF6B35 0%, #004E89 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Marathon Majors League</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">
      Your verification code is:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="background: white; border: 2px solid #FF6B35; padding: 20px; border-radius: 10px; display: inline-block;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #004E89; font-family: 'Courier New', monospace;">
          ${otpCode}
        </span>
      </div>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
      This code will expire in <strong>5 minutes</strong> for security purposes.
    </p>
    
    <p style="font-size: 14px; color: #999; margin-top: 20px;">
      If you didn't request this code, you can safely ignore this email.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Thanks,<br>
      <strong>Marathon Majors League Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
  
  return { subject, text, html };
}

/**
 * Generate welcome email
 */
export function generateWelcomeEmail(email, displayName) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const subject = `Welcome to Marathon Majors League!`;
  
  const text = `
Hi ${displayName},

Welcome to Marathon Majors League! We're excited to have you on board.

You can now:
- Create or join fantasy marathon leagues
- Draft elite marathon runners
- Track live results during races
- Compete with friends for ultimate bragging rights

Get started: ${appUrl}

If you have any questions, feel free to reach out.

Happy drafting!
Marathon Majors League Team
  `.trim();
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Marathon Majors League</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF6B35 0%, #004E89 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏃‍♂️ Marathon Majors League</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${displayName},</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">
      Welcome to <strong>Marathon Majors League</strong>! We're excited to have you on board.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h2 style="color: #004E89; margin-top: 0; font-size: 20px;">You can now:</h2>
      <ul style="list-style: none; padding: 0; margin: 15px 0;">
        <li style="margin: 10px 0; padding-left: 30px; position: relative;">
          <span style="position: absolute; left: 0; color: #FF6B35; font-weight: bold;">✓</span>
          Create or join fantasy marathon leagues
        </li>
        <li style="margin: 10px 0; padding-left: 30px; position: relative;">
          <span style="position: absolute; left: 0; color: #FF6B35; font-weight: bold;">✓</span>
          Draft elite marathon runners
        </li>
        <li style="margin: 10px 0; padding-left: 30px; position: relative;">
          <span style="position: absolute; left: 0; color: #FF6B35; font-weight: bold;">✓</span>
          Track live results during races
        </li>
        <li style="margin: 10px 0; padding-left: 30px; position: relative;">
          <span style="position: absolute; left: 0; color: #FF6B35; font-weight: bold;">✓</span>
          Compete with friends for bragging rights
        </li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}" style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Get Started
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      If you have any questions, feel free to reach out.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      Happy drafting!<br>
      <strong>Marathon Majors League Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
  
  return { subject, text, html };
}
