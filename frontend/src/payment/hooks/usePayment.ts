import { useCallback, useMemo, useState } from "react";

import type { PaymentProvider } from "../types";
import type { PaymentSDKDependencies } from "../core/dependencies";
import { PaymentFactory } from "../factory/PaymentFactory";

export interface UsePaymentOptions {
  provider?: PaymentProvider;
  deps: PaymentSDKDependencies;
}

export function usePayment(options: UsePaymentOptions) {
  const gateway = useMemo(() => PaymentFactory.createGateway({ provider: options.provider }), [options.provider]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const clearError = useCallback(() => setError(""), []);

  const payWithCard = useCallback(
    async (payload: unknown) => {
      clearError();
      setIsLoading(true);
      try {
        const initResponse = await options.deps.initiateCardPayment(payload);
        await gateway.processPayment(initResponse);
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Payment failed. Please try again.";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [gateway, clearError, options.deps]
  );

  const payWithWallet = useCallback(
    async (payload: unknown): Promise<unknown | null> => {
      clearError();
      setIsLoading(true);
      try {
        if (!options.deps.initiateWalletPayment) {
          throw new Error("Wallet payments are not configured.");
        }

        return await options.deps.initiateWalletPayment(payload);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Payment failed. Please try again.";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError, options.deps]
  );

  return { provider: gateway.provider, isLoading, error, clearError, payWithCard, payWithWallet };
}
