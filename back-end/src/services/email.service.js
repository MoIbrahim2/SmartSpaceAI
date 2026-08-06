const nodemailer = require('nodemailer');

/**
 * Reusable Email Service for sending transactional emails (invitations, OTPs, verification codes)
 */

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && user !== 'your_gmail_email@gmail.com' && pass && pass !== 'your_16_digit_gmail_app_password') {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    }
  }
  return transporter;
};

/**
 * Send seller activation invitation email with OTP verification code
 * @param {Object} options
 * @param {string} options.email
 * @param {string} options.firstName
 * @param {string} options.verificationCode
 */
const sendSellerInvitationEmail = async ({ email, firstName, verificationCode }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const activationUrl = `${clientUrl}/activate-seller?email=${encodeURIComponent(email)}`;

  const subject = 'Welcome to SmartSpace AI - Activate Your Seller Account';
  const textBody = `
Hello ${firstName},

Your seller account on SmartSpace AI has been created.

Your Verification Code: ${verificationCode}

Activate your account here: ${activationUrl}

Note: This code expires in 15 minutes.
  `.trim();

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4F46E5; margin-top: 0;">Welcome to SmartSpace AI</h2>
      <p style="color: #334155; font-size: 15px;">Hello <strong>${firstName}</strong>,</p>
      <p style="color: #334155; font-size: 15px;">Your seller account on SmartSpace AI has been created by the administration team.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit Verification Code</p>
        <h1 style="margin: 0; letter-spacing: 6px; color: #0f172a; font-size: 32px; font-family: monospace;">${verificationCode}</h1>
      </div>
      
      <p style="color: #334155; font-size: 15px;">Click the button below to verify and complete your seller account activation:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${activationUrl}" style="background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">Activate Seller Account</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Note: This verification code expires in 15 minutes. If you did not expect this invitation, please ignore this email.</p>
    </div>
  `.trim();

  const mailTransporter = getTransporter();

  if (mailTransporter) {
    try {
      const fromAddress = process.env.EMAIL_FROM || `"SmartSpace AI" <${process.env.SMTP_USER}>`;
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`[EMAIL SERVICE] Sent Gmail activation email to ${email} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL SERVICE] Failed to send email via Gmail SMTP to ${email}:`, err.message);
      console.log(`[EMAIL FALLBACK] Verification Code for ${email}: ${verificationCode}`);
      return { success: false, error: err.message };
    }
  } else {
    // If SMTP_USER or SMTP_PASS is not configured in .env yet
    console.log('====================================================');
    console.log(`[EMAIL SERVICE (SIMULATED)] To: ${email}`);
    console.log(`[EMAIL SERVICE (SIMULATED)] Subject: ${subject}`);
    console.log(`[EMAIL SERVICE (SIMULATED)] Verification Code: ${verificationCode}`);
    console.log(`[EMAIL SERVICE (SIMULATED)] Activation URL: ${activationUrl}`);
    console.log('====================================================');

    return { success: true, simulated: true };
  }
};

/**
 * Send regular user email verification code OTP
 * @param {Object} options
 * @param {string} options.email
 * @param {string} options.firstName
 * @param {string} options.verificationCode
 */
const sendUserVerificationEmail = async ({ email, firstName, verificationCode }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyUrl = `${clientUrl}/verify-email?email=${encodeURIComponent(email)}`;

  const subject = 'SmartSpace AI - Verify Your Email Address';
  const textBody = `
Hello ${firstName},

Thank you for signing up for SmartSpace AI.

Your 6-Digit Verification Code: ${verificationCode}

Verify your email address here: ${verifyUrl}

Note: This code expires in 15 minutes.
  `.trim();

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4F46E5; margin-top: 0;">SmartSpace AI Email Verification</h2>
      <p style="color: #334155; font-size: 15px;">Hello <strong>${firstName}</strong>,</p>
      <p style="color: #334155; font-size: 15px;">Thank you for joining SmartSpace AI! Please use the 6-digit verification code below to complete your registration:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit OTP Code</p>
        <h1 style="margin: 0; letter-spacing: 6px; color: #0f172a; font-size: 32px; font-family: monospace;">${verificationCode}</h1>
      </div>
      
      <div style="text-align: center; margin: 28px 0;">
        <a href="${verifyUrl}" style="background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">Verify Email Address</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Note: This verification code expires in 15 minutes. If you did not request this code, please ignore this email.</p>
    </div>
  `.trim();

  const mailTransporter = getTransporter();

  if (mailTransporter) {
    try {
      const fromAddress = process.env.EMAIL_FROM || `"SmartSpace AI" <${process.env.SMTP_USER}>`;
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`[EMAIL SERVICE] Sent verification email to ${email} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL SERVICE] Failed to send verification email to ${email}:`, err.message);
      console.log(`[EMAIL FALLBACK] Verification Code for ${email}: ${verificationCode}`);
      return { success: false, error: err.message };
    }
  } else {
    console.log('====================================================');
    console.log(`[EMAIL SERVICE (SIMULATED)] To: ${email}`);
    console.log(`[EMAIL SERVICE (SIMULATED)] Subject: ${subject}`);
    console.log(`[EMAIL SERVICE (SIMULATED)] Verification Code: ${verificationCode}`);
    console.log(`[EMAIL SERVICE (SIMULATED)] Verify URL: ${verifyUrl}`);
    console.log('====================================================');

    return { success: true, simulated: true };
  }
};

/**
 * Send password reset code OTP email
 * @param {Object} options
 * @param {string} options.email
 * @param {string} options.firstName
 * @param {string} options.verificationCode
 */
const sendPasswordResetEmail = async ({ email, firstName, verificationCode }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/forgot-password?email=${encodeURIComponent(email)}`;

  const subject = 'SmartSpace AI - Password Reset Request';
  const textBody = `
Hello ${firstName},

We received a request to reset the password for your SmartSpace AI account.

Your 6-Digit Password Reset Code: ${verificationCode}

Reset your password here: ${resetUrl}

Note: This code expires in 15 minutes. If you did not request a password reset, please ignore this email.
  `.trim();

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4F46E5; margin-top: 0;">SmartSpace AI Password Reset</h2>
      <p style="color: #334155; font-size: 15px;">Hello <strong>${firstName}</strong>,</p>
      <p style="color: #334155; font-size: 15px;">We received a request to reset your password. Use the 6-digit verification code below to set a new password:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your Password Reset Code</p>
        <h1 style="margin: 0; letter-spacing: 6px; color: #0f172a; font-size: 32px; font-family: monospace;">${verificationCode}</h1>
      </div>
      
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">Reset Password</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Note: This reset code expires in 15 minutes. If you did not request a password reset, your account is secure and you can safely ignore this email.</p>
    </div>
  `.trim();

  const mailTransporter = getTransporter();

  if (mailTransporter) {
    try {
      const fromAddress = process.env.EMAIL_FROM || `"SmartSpace AI" <${process.env.SMTP_USER}>`;
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`[EMAIL SERVICE] Sent password reset email to ${email} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL SERVICE] Failed to send password reset email to ${email}:`, err.message);
      console.log(`[EMAIL FALLBACK] Password Reset Code for ${email}: ${verificationCode}`);
      return { success: false, error: err.message };
    }
  } else {
    console.log('====================================================');
    console.log(`[EMAIL SERVICE (SIMULATED)] To: ${email}`);
    console.log(`[EMAIL SERVICE (SIMULATED)] Subject: ${subject}`);
    console.log(`[EMAIL SERVICE (SIMULATED)] Password Reset Code: ${verificationCode}`);
    console.log(`[EMAIL SERVICE (SIMULATED)] Reset URL: ${resetUrl}`);
    console.log('====================================================');

    return { success: true, simulated: true };
  }
};

module.exports = {
  sendSellerInvitationEmail,
  sendUserVerificationEmail,
  sendPasswordResetEmail,
};

