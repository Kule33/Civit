import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { CURRENCIES, MOCK_QUESTIONS } from "./constants";
import PaperDetailsForm from "./components/PaperDetailsForm";
import SummarySidebar from "./components/SummarySidebar";

// Hooks
import { usePayment } from "../../../payment/hooks/usePayment";
import {
  initiateCardPayment,
  initiateWalletPayment,
} from "../../../services/paymentApi/api";

const PaymentPage = () => {
  const paperId = "12321";
  const baseAmount = 1500; // LKR base price

  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);

  // Derived state
  const convertedAmount = (baseAmount * selectedCurrency.rate).toFixed(2);

  // Payment Hook
  const { isLoading, error, clearError, payWithCard, payWithWallet } =
    usePayment({
      deps: { initiateCardPayment, initiateWalletPayment },
    });

  const getPaymentPayload = () => ({
    amount: parseFloat(convertedAmount),
    paperId,
    currency: selectedCurrency.code,
    paymentId: "156233524",
    questionsList: [], // Map your questions here if needed
  });

  const handleCardPayment = async () => {
    clearError();
    try {
      await payWithCard(getPaymentPayload());
    } catch (e) {
      console.error(e);
    }
  };

  const handleWalletPayment = async () => {
    clearError();
    try {
      const res = await payWithWallet(getPaymentPayload());
      if (res?.success) alert("Payment Successful");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Top Nav */}
        <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition mb-8 group">
          <div className="p-2 bg-white rounded-full border border-gray-200 group-hover:border-gray-300 shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Editor</span>
        </button>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel (Content) */}
          <div className="space-y-8">
            <PaperDetailsForm
              paperId={paperId}
              questions={MOCK_QUESTIONS} // Pass actual questions from your state
            />
          </div>

          {/* Right Panel (Sidebar) */}
          <div>
            <SummarySidebar
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
              amount={convertedAmount}
              isLoading={isLoading}
              error={error}
              onPayCard={handleCardPayment}
              onPayWallet={handleWalletPayment}
              questions={MOCK_QUESTIONS}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
