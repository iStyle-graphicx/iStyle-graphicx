# WhatsApp OTP Registration Setup Guide

VanGo Delivery now supports WhatsApp-based registration with OTP verification. This provides a seamless registration experience for users who prefer using their phone numbers.

## Features

- ✅ Phone number registration with OTP verification
- ✅ WhatsApp message delivery via Twilio
- ✅ Secure OTP storage with expiration
- ✅ Rate limiting and attempt tracking
- ✅ Automatic user account creation
- ✅ Development mode for testing without Twilio

## Setup Instructions

### 1. Database Setup

Run the SQL migration script to create the necessary tables:

\`\`\`bash
# The script creates:
# - otp_codes table for storing verification codes
# - phone_number column in profiles table
# - Helper functions for OTP generation and cleanup
\`\`\`

Execute: `scripts/013_whatsapp_otp_system.sql`

### 2. Twilio Configuration (Production)

To enable WhatsApp OTP in production, you need a Twilio account with WhatsApp enabled:

1. **Create a Twilio Account**
   - Sign up at https://www.twilio.com
   - Verify your account

2. **Enable WhatsApp**
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow the setup wizard to enable WhatsApp
   - Get your WhatsApp-enabled phone number

3. **Get Your Credentials**
   - Account SID: Found in your Twilio Console dashboard
   - Auth Token: Found in your Twilio Console dashboard
   - WhatsApp Number: Your Twilio WhatsApp-enabled number (format: +14155238886)

4. **Add Environment Variables**

Add these to your Vercel project or `.env.local`:

\`\`\`env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886
\`\`\`

### 3. Development Mode

In development, the system works without Twilio configuration:
- OTP codes are logged to the console
- No actual WhatsApp messages are sent
- Perfect for testing the flow

### 4. Testing

**Development Testing:**
1. Click "Register with WhatsApp" in the auth modal
2. Enter a phone number in E.164 format (e.g., +27123456789)
3. Check the console for the OTP code
4. Enter the OTP code to verify
5. Complete your profile information

**Production Testing:**
1. Ensure Twilio environment variables are set
2. Use a real phone number with WhatsApp installed
3. You'll receive the OTP via WhatsApp
4. Complete the registration flow

## Phone Number Format

All phone numbers must be in E.164 format:
- Start with `+` followed by country code
- No spaces, dashes, or parentheses
- Examples:
  - South Africa: +27123456789
  - USA: +14155551234
  - UK: +447911123456

## Security Features

- **OTP Expiration**: Codes expire after 10 minutes
- **Attempt Limiting**: Maximum 3 verification attempts per OTP
- **Single Use**: OTPs are marked as verified after successful use
- **Automatic Cleanup**: Expired OTPs are cleaned up automatically
- **Rate Limiting**: Prevents spam by limiting OTP requests

## API Endpoints

### Send OTP
\`\`\`
POST /api/auth/whatsapp/send-otp
Body: { phoneNumber: "+27123456789" }
\`\`\`

### Verify OTP
\`\`\`
POST /api/auth/whatsapp/verify-otp
Body: {
  phoneNumber: "+27123456789",
  otpCode: "123456",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com" // optional
}
\`\`\`

## Troubleshooting

**OTP not received:**
- Check that Twilio credentials are correct
- Verify the phone number has WhatsApp installed
- Check Twilio console for delivery status
- Ensure the phone number is in E.164 format

**"WhatsApp service not configured" error:**
- Verify environment variables are set correctly
- Restart your development server after adding env vars
- Check that TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER are all present

**"Phone number already registered" error:**
- The phone number is already associated with an account
- User should log in instead of registering

## Cost Considerations

Twilio WhatsApp messaging costs:
- Approximately $0.005 per message (varies by country)
- Free trial credits available for testing
- Monitor usage in Twilio console

## Next Steps

1. Run the database migration script
2. Add Twilio credentials to environment variables (for production)
3. Test the registration flow
4. Monitor OTP delivery and success rates
5. Consider adding phone number verification for existing users
