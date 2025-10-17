# Twilio WhatsApp Setup Guide

## Getting Your Twilio Credentials

To enable WhatsApp OTP registration in VanGo, you need to set up a Twilio account and configure WhatsApp messaging.

### Step 1: Create a Twilio Account

1. Go to [Twilio.com](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number

### Step 2: Get Your Credentials

1. Go to your [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
   - Account SID starts with `AC` (e.g., `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Auth Token is a 32-character string
3. Copy these values - you'll need them for environment variables

### Step 3: Enable WhatsApp Messaging

1. In the Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to connect your WhatsApp sandbox
3. Note the WhatsApp-enabled phone number (e.g., `+13613061135`)

### Step 4: Configure Environment Variables

Add these environment variables to your Vercel project or `.env.local` file:

\`\`\`bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_32_character_auth_token
TWILIO_WHATSAPP_NUMBER=+13613061135
\`\`\`

**Important Notes:**
- The Account SID MUST start with `AC`
- The Auth Token should be at least 32 characters
- The WhatsApp number must include the country code with `+`

### Step 5: Test the Integration

1. Deploy your app or restart your development server
2. Try registering with a WhatsApp number
3. You should receive an OTP code via WhatsApp

## Development Mode

If Twilio credentials are not configured, the app will run in development mode:
- OTP codes will be displayed in the browser console
- No actual WhatsApp messages will be sent
- This is useful for testing without Twilio setup

## Troubleshooting

### Error: "Invalid Twilio Account SID"
- Make sure your Account SID starts with `AC`
- Check that you copied the full Account SID from Twilio Console

### Error: "Authentication Error - invalid username"
- Verify your Account SID is correct
- Make sure you're using the Auth Token, not the API Key

### Error: "WhatsApp is not enabled for this Twilio number"
- Complete the WhatsApp sandbox setup in Twilio Console
- Make sure you're using a WhatsApp-enabled number

### Messages Not Sending
- Check that the recipient's phone number is in E.164 format (+27123456789)
- Verify the recipient has WhatsApp installed
- In sandbox mode, the recipient must first send a join message to your Twilio WhatsApp number

## Production Setup

For production use:
1. Upgrade to a paid Twilio account
2. Request WhatsApp Business API access
3. Get your WhatsApp number approved by Twilio
4. Update the `TWILIO_WHATSAPP_NUMBER` environment variable

## Cost

- Twilio offers free trial credits
- WhatsApp messages cost approximately $0.005 per message
- Check [Twilio Pricing](https://www.twilio.com/whatsapp/pricing) for current rates
