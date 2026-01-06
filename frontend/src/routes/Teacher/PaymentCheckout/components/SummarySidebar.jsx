import React from "react";
import { Wallet, CreditCard, CheckCircle } from "lucide-react";
import visa from "../../../../assets/images/visa.png";
import mastercard from "../../../../assets/images/master-card.png";
import amex from "../../../../assets/images/amex.png";
import CurrencySelector from "./CurrencySelector";
import PriceBreakdown from "./PriceBreakdown";
import CardPaymentOption from "./CardPaymentOption";
import WalletPaymentOption from "./WalletPaymentOption";
const SummarySidebar = ({
  selectedCurrency,
  setSelectedCurrency,
  amount,
  isLoading,
  error,
  onPayCard,
  onPayWallet,
  questions,
}) => {
const walletBalance = 8000;
  const payAmount = 1500;
  return (
    <div className="h-screen lg:h-full border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-8 overflow-hidden lg:overflow-visible">
      {/* Trust Badge */}

      <div className="">
        <h3 className="text-lg font-semibold text-gray-800">
          Selected Questions Summary
        </h3>
      </div>
      <div className="py-5">
        <PriceBreakdown questions={questions} />

        {/* Total Area */}
        <div className="mt-6 flex items-end justify-between bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-blue-100">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">
              Total Amount
            </p>
            <div className="text-2xl font-bold text-gray-900">
              {selectedCurrency.code} {amount}
            </div>
          </div>
          <CurrencySelector
            selected={selectedCurrency}
            onSelect={setSelectedCurrency}
          />
        </div>
      </div>
      <div className="sticky bottom-0 lg:static flex-shrink-0 bg-white px-0 lg:px-0 py-4 lg:py-0 z-40">
        {/* PAY BY */}
        <div className="text-xs mt-8 lg:text-sm font-semibold text-gray-700 mb-2 lg:mb-3">
          Pay using
        </div>

        {/* PAYMENT METHODS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4 mb-2 lg:mb-0">



          <WalletPaymentOption
            onPayWallet={() => {}}
            isLoadingWallet={false}
            walletBalance={walletBalance} // Pass the user's current balance
            payAmount={payAmount}         // Pass the cart total
          />


          {/* CARD */}
          <CardPaymentOption onPayCard={onPayCard} isLoading={isLoading} />
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-3 p-2 lg:p-3 bg-red-50 border border-red-200 rounded-lg text-xs lg:text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="mt-2 lg:mt-8 pt-2 lg:pt-4 border-t border-gray-200 space-y-2 lg:space-y-4">
          {/* Helper text */}
          <p className="text-[10px] lg:text-xs text-gray-400 text-center">
            Not ready for payment?
          </p>

          {/* Secondary actions */}
          <div className="flex justify-center gap-2 lg:gap-4">
            <button
              className="px-3 lg:px-5 py-1 lg:py-1.5 text-[10px] lg:text-xs font-medium rounded-full
                 border border-gray-300 text-gray-700
                 hover:bg-gray-100 transition"
            >
              Add to locker
            </button>

            <button
              className="px-3 lg:px-5 py-1 lg:py-1.5 text-[10px] lg:text-xs font-medium rounded-full
                 border border-gray-300 text-gray-700
                 hover:bg-gray-100 transition"
            >
              Save as draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummarySidebar;
