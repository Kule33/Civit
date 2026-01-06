# Payment SDK (Frontend)

This folder is intentionally designed as a **reusable payment SDK**.

It does **not** know:
- Which backend endpoint to call
- What request-body fields your app uses (paperId, cartId, lessonId, etc.)
- How your axios client/auth token works

Instead, your application provides (“injects”) a small adapter (`deps`) that:
1) Calls your backend (any endpoint, any payload shape)
2) Returns the backend response as-is
3) The SDK interprets that response based on the selected provider (PayHere/WebXPay)

## Folder responsibilities

- [src/payment/hooks/usePayment.ts](hooks/usePayment.ts)
  - The UI-facing hook.
  - Handles loading + error state.
  - Calls your injected adapter functions.
  - Uses the factory to select the gateway.

- [src/payment/core/IPaymentGateway.ts](core/IPaymentGateway.ts)
  - Strategy interface: every gateway must implement `processPayment(initResponse)`.

- [src/payment/factory/PaymentFactory.ts](factory/PaymentFactory.ts)
  - Factory: chooses which gateway implementation to use.
  - Default is PayHere.

- [src/payment/gateways/payhere/PayHereGateway.ts](gateways/payhere/PayHereGateway.ts)
  - PayHere strategy.
  - Converts backend response into PayHere form fields, then submits the form.

- [src/payment/types/payment.ts](types/payment.ts)
  - SDK-public types like `PaymentGatewayConfig`.

## Public API (what you should import)

Only import from:
- [src/payment/index.ts](index.ts)

Recommended usage:
- `usePayment()`
- `PaymentProvider`
- `PaymentGatewayConfig` (if you want to type your adapter)

## Core types

### `PaymentGatewayConfig` (internal normalized shape)

Defined in [src/payment/types/payment.ts](types/payment.ts):

- `fields: Record<string, string>`
  - The final form fields required by the payment provider.
  - Example for PayHere: `merchant_id`, `order_id`, `amount`, `currency`, `hash`, etc.

- `url?: string`
  - Optional checkout URL override.
  - If not provided, PayHere gateway will fallback to `VITE_PAYHERE_CHECKOUT_URL` or sandbox.

### `PaymentSDKDependencies` (`deps`)

Defined in [src/payment/core/dependencies.ts](core/dependencies.ts):

- `initiateCardPayment(payload) => Promise<unknown>`
  - Your app calls its backend (any endpoint, any payload shape).
  - Returns the backend response.
  - The SDK (PayHere gateway) converts it to provider fields internally.

- `initiateWalletPayment?(payload) => Promise<unknown>`
  - Optional.
  - If you don’t provide it, the SDK will show a “Wallet payments are not configured.” error.

## How the flow works (Card)

When you call `payWithCard(payload)` from the UI:

1) UI → `payWithCard(payload)`
2) SDK hook calls your adapter: `deps.initiateCardPayment(payload)`
3) Your adapter calls your backend and receives *backend-specific* response
4) SDK selects gateway via factory (PayHere by default)
5) SDK calls `gateway.processPayment(initResponse)`
6) PayHere gateway converts initResponse → fields and submits the form
7) PayHere gateway submits HTML form to PayHere checkout

Important: the SDK does read your backend response, but only inside the provider gateway.

## Example: app adapter (paymentApi) implementation

This is project-specific code and should live OUTSIDE the SDK folder.
In this repo it lives here:
- [src/services/paymentApi/payments.ts](../services/paymentApi/payments.ts)

Minimal template you can copy to another project:

```ts
// src/services/paymentApi/payments.ts

export async function initiateCardPayment(payload: unknown): Promise<unknown> {
  const response = await fetch("/api/payments/card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await response.json();
}

export async function initiateWalletPayment(payload: unknown): Promise<unknown> {
  const response = await fetch("/api/payments/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await response.json();
}
```

### What should `payload` look like?

Anything your backend expects.
Examples:
- Papermaker: `{ amount, currency, paperId, paymentId, questionsList }`
- Ecommerce: `{ cartId, couponCode }`
- Tutoring: `{ lessonPackageId, studentId }`

## Example: UI usage

In a component (Dashboard, Checkout page, etc.):

```jsx
import { usePayment } from "../payment";
import { initiateCardPayment, initiateWalletPayment } from "../services/paymentApi/payments";

const { payWithCard, payWithWallet, isLoading, error } = usePayment({
  deps: { initiateCardPayment, initiateWalletPayment },
});

await payWithCard({ amount: 1500, currency: "LKR", paperId: "123" });
```

## Switching providers (PayHere → WebXPay)

Provider selection happens in one place:
- [src/payment/factory/PaymentFactory.ts](factory/PaymentFactory.ts)

Later, when `WEBXPAY` is implemented, you can:
- Select it by passing `provider: PaymentProvider.WEBXPAY` into `usePayment({ provider, deps })`
- Or change the factory default

## Environment variables (PayHere)

- `VITE_PAYHERE_CHECKOUT_URL`
  - Optional.
  - If not set, the PayHere gateway uses the sandbox checkout URL.
