import React from "react";
import { CreditCard, CheckCircle, ShieldCheck } from "lucide-react";
import visa from "../../../../assets/images/visa.png";
import mastercard from "../../../../assets/images/master-card.png";
import amex from "../../../../assets/images/amex.png";

const CardPaymentOption = ({ onPayCard, isLoading }) => {
  return (
    <div className="relative flex flex-col justify-between h-full w-full rounded-2xl border border-blue-300 bg-blue-50 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-blue-500 hover:shadow-md">
      
      {/* Content Section */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon - White background to pop against blue card */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm border border-blue-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Card Payment
              </h3>
            </div>
          </div>
        </div>

        {/* Card logos */}
        <div className="flex items-center gap-3 mb-2 opacity-90">
          <img src={visa} alt="Visa" className="h-5 object-contain" />
          <img src={mastercard} alt="MasterCard" className="h-5 object-contain" />
          <img src={amex} alt="Amex" className="h-5 object-contain" />
        </div>

        {/* Trust badge - Compact under logos */}
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span className="text-[10px] text-gray-600 leading-none">
            Secured by <span className="font-bold text-gray-800">PayHere</span>
          </span>
        </div>
      </div>

      {/* Footer - CTA Button */}
      <div className="mt-auto pt-6">
        <button
          onClick={onPayCard}
          disabled={isLoading}
          className="
            w-full rounded-xl bg-blue-600 py-3
            text-sm font-semibold text-white shadow-md shadow-blue-200
            transition-all hover:bg-blue-700 hover:shadow-blue-300
            active:scale-[0.99]
            disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
          "
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing…
            </div>
          ) : (
            "Pay with Card"
          )}
        </button>
      </div>
    </div>
  );
};

export default CardPaymentOption;