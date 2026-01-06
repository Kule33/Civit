import type { IPaymentGateway } from "../../core/IPaymentGateway";
import type { PaymentGatewayConfig, PaymentProvider } from "../../types";
import { PaymentProvider as PaymentProviderEnum } from "../../types";

import { getPayHereConfig } from "./payhere.config";
import { submitPayHereForm } from "./utils";

export class PayHereGateway implements IPaymentGateway {
  public readonly provider: PaymentProvider = PaymentProviderEnum.PAYHERE;

  public async processPayment(initResponse: unknown): Promise<void> {
    const config = this.normalizeBackendResponse(initResponse);
    const checkoutUrl = config.url || getPayHereConfig().checkoutUrl;
    submitPayHereForm(config.fields, checkoutUrl);
  }

  private normalizeBackendResponse(data: unknown): PaymentGatewayConfig {
    const anyData = data as any;

    if (anyData?.success === false) {
      throw new Error(anyData?.message || "Failed to initiate payment.");
    }

    // Preferred shape (already normalized by backend/payment-server): { url, fields }
    if (anyData?.fields && typeof anyData.fields === "object") {
      const fields: Record<string, string> = {};
      for (const [key, value] of Object.entries(anyData.fields as Record<string, unknown>)) {
        fields[key] = value == null ? "" : String(value);
      }

      return {
        url:
          (typeof anyData.url === "string" && anyData.url) ||
          (typeof anyData.paymentUrl === "string" && anyData.paymentUrl) ||
          undefined,
        fields,
      };
    }

    // Current backend shape in this repo: { paymentUrl?, paymentDetails: { merchantId, hash, ... } }
    const d = anyData?.paymentDetails;
    if (!d) {
      throw new Error(anyData?.message || "Invalid payment response.");
    }

    return {
      url:
        (typeof anyData.paymentUrl === "string" && anyData.paymentUrl) ||
        import.meta.env.VITE_PAYHERE_CHECKOUT_URL ||
        undefined,
      fields: {
        merchant_id: String(d.merchantId ?? ""),
        return_url: String(d.returnUrl ?? ""),
        cancel_url: String(d.cancelUrl ?? ""),
        notify_url: String(d.notifyUrl ?? ""),
        order_id: String(d.orderId ?? ""),
        items: String(d.items ?? ""),
        currency: String(d.currency ?? ""),
        amount: Number(d.amount ?? 0).toFixed(2),
        first_name: String(d.firstName ?? ""),
        last_name: String(d.lastName ?? ""),
        email: String(d.email ?? ""),
        phone: "",
        address: "",
        city: "",
        country: "Sri Lanka",
        hash: String(d.hash ?? ""),
      },
    };
  }
}
