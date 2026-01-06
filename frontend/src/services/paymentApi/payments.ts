import { paymentApiClient } from "./client";

/**
 * App adapter: calls your backend and returns whatever it returns.
 * The payment SDK should not import this file.
 */
export async function initiateCardPayment(payload: unknown): Promise<unknown> {
  const response = await paymentApiClient.post("/api/payments/card", payload);
  return response.data;
}

export async function initiateWalletPayment(payload: unknown): Promise<unknown> {
  const response = await paymentApiClient.post("/api/payments/wallet", payload);
  return response.data;
}
