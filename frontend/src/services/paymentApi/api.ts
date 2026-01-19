import axios from "axios";

import { initiateCardPayment as initiateCardPaymentImpl, initiateWalletPayment as initiateWalletPaymentImpl } from "./payments";

export const initiateCardPayment = async (payload: unknown): Promise<unknown> => {
  try {
    return await initiateCardPaymentImpl(payload);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Payment failed. Please try again.");
    }
    throw new Error("An unexpected error occurred during payment.");
  }
};

export const initiateWalletPayment = async (payload: unknown): Promise<unknown> => {
  try {
    return await initiateWalletPaymentImpl(payload);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Payment failed. Please try again.");
    }
    throw new Error("An unexpected error occurred during payment.");
  }
};
