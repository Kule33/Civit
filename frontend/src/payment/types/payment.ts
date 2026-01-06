/**
 * SDK-public, provider-agnostic config object.
 * `fields` should contain final form fields (e.g., merchant_id, hash, amount...).
 */
export type PaymentGatewayFields = Record<string, string>;

export interface PaymentGatewayConfig {
  fields: PaymentGatewayFields;
  /** Optional override; gateways can fallback to env defaults. */
  url?: string;
}
