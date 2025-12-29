import twilio from 'twilio';

let twilioInstance: any = null;

export function getTwilio() {
  if (twilioInstance) return twilioInstance;
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  // If keys are missing, just return null (feature disabled) instead of crashing
  if (!accountSid || !authToken) {
    console.warn("Twilio keys missing, SMS feature disabled.");
    return null;
  }
  
  twilioInstance = twilio(accountSid, authToken);
  return twilioInstance;
}
