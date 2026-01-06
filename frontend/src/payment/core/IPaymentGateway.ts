import type { PaymentProvider } from "../types";

/**
 * Strategy interface: all payment gateways must implement this.
 */
export interface IPaymentGateway {
  readonly provider: PaymentProvider;

  /**
   * Starts a card payment flow.
   * For redirect/form based gateways this will usually navigate away.
   */
  processPayment(initResponse: unknown): Promise<void>;
}
