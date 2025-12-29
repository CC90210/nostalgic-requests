import { Resend } from "resend";

// Only initialize Resend if API key is available
// This prevents build errors when the key is not set
export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

