import { Resend } from "resend";

import { env } from "@/core/config/env";

/** Cached Resend client instance, created on first call to getResendClient(). */
let resendClient: Resend | null = null;

/**
 * Get the Resend email client. Creates the client on first use.
 * @throws Error if RESEND_API_KEY environment variable is not configured
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is required for sending emails");
    }
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}
