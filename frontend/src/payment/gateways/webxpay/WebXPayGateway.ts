import type { IPaymentGateway } from "../../core/IPaymentGateway";
import type { PaymentGatewayConfig, PaymentProvider } from "../../types";
import { PaymentProvider as PaymentProviderEnum } from "../../types";

/**
 * Placeholder for future WebXPay integration.
 */
export class WebXPayGateway implements IPaymentGateway {
  public readonly provider: PaymentProvider = PaymentProviderEnum.WEBXPAY;

  public async processPayment(_initResponse: unknown): Promise<void> {
    throw new Error("WEBXPAY gateway is not implemented yet.");
  }
}
