import type { IPaymentGateway } from "../core/IPaymentGateway";
import { PaymentProvider } from "../types";
import { PayHereGateway } from "../gateways/payhere/PayHereGateway";
import { WebXPayGateway } from "../gateways/webxpay/WebXPayGateway";

export interface PaymentFactoryOptions {
  provider?: PaymentProvider;
}

/**
 * Factory: decides which gateway strategy to use.
 * Default provider is PayHere.
 */
export class PaymentFactory {
  public static createGateway(options: PaymentFactoryOptions): IPaymentGateway {
    const provider = options.provider ?? PaymentProvider.PAYHERE;

    switch (provider) {
      case PaymentProvider.PAYHERE:
        return new PayHereGateway();
      case PaymentProvider.WEBXPAY:
        return new WebXPayGateway();
      default:
        return new PayHereGateway();
    }
  }
}
