import { Resend } from "resend";

import { env } from "@/core/config/env";

/**
 * Singleton Resend client instance.
 * Initialized lazily on first use.
 */
let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}
