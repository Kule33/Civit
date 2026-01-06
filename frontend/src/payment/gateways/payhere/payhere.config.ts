export interface PayHereConfig {
  /** PayHere checkout URL (sandbox by default). */
  checkoutUrl: string;
}

export function getPayHereConfig(): PayHereConfig {
  return {
    checkoutUrl: import.meta.env.VITE_PAYHERE_CHECKOUT_URL || "https://sandbox.payhere.lk/pay/checkout",
  };
}
