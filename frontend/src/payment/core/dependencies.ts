/**
 * Dependency injection contract.
 * The app decides endpoints + payload schema.
 * The SDK decides how to interpret the backend response per provider.
 */
export type PaymentSDKDependencies = {
  initiateCardPayment: (payload: unknown) => Promise<unknown>;
  initiateWalletPayment?: (payload: unknown) => Promise<unknown>;
};
