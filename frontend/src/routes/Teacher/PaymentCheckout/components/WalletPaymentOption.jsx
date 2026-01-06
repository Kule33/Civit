import React from "react";
import { Wallet, Zap, AlertCircle } from "lucide-react";

const WalletPaymentOption = ({ 
  onPayWallet, 
  isLoadingWallet, 
  walletBalance = 0, 
  payAmount = 0 
}) => {
  const hasInsufficientFunds = walletBalance < payAmount;
  const remainingBalance = walletBalance - payAmount;

  return (
    <div 
      className={`
        relative flex flex-col justify-between h-full w-full rounded-2xl border p-4 sm:p-5 shadow-sm transition-all duration-200 
        hover:shadow-md
        ${hasInsufficientFunds 
          ? "border-red-200 bg-red-50 hover:border-red-300" 
          : "border-gray-300 bg-gray-50 hover:border-gray-500"}
      `}
    >
      
      {/* Content Section */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border ${hasInsufficientFunds ? "text-red-500 border-red-100" : "text-gray-700 border-gray-200"}`}>
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                My Wallet
              </h3>
            </div>
          </div>
          {/* Status Icon */}
          {hasInsufficientFunds &&
             <div className="flex items-center gap-1 text-[10px]">
                <AlertCircle className="w-3 h-3 text-red-600" />
             </div>
          }
        </div>

        {/* Balance Details */}
        <div className="space-y-2 mb-2">
          {/* Current Balance */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Available Balance</span>
            <span className="font-bold text-gray-900">Rs {walletBalance.toLocaleString()}</span>
          </div>

          {/* Divider */}
          <div className={`h-px w-full ${hasInsufficientFunds ? "bg-red-200" : "bg-gray-200"}`} />

          {/* Remaining After Payment */}
          <div className="flex items-center justify-between text-xs">
            <span className={`${hasInsufficientFunds ? "text-red-500" : "text-gray-500"}`}>
              Balance after payment
            </span>
            <span className={`font-bold ${hasInsufficientFunds ? "text-red-600" : "text-emerald-600"}`}>
              {hasInsufficientFunds ? "Insufficient" : `Rs ${remainingBalance.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer - CTA Button */}
      <div className="mt-auto pt-6">
        <button
          onClick={onPayWallet}
          disabled={isLoadingWallet || hasInsufficientFunds}
          className={`
            w-full rounded-xl py-3 text-sm font-semibold text-white shadow-md 
            transition-all active:scale-[0.99]
            disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
            ${hasInsufficientFunds 
              ? "bg-gray-400 shadow-none cursor-not-allowed" 
              : "bg-gray-900 shadow-gray-300 hover:bg-gray-800 hover:shadow-gray-400"}
          `}
        >
          {isLoadingWallet ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Processing…
            </div>
          ) : hasInsufficientFunds ? (
            "Top-up Wallet to Pay"
          ) : (
            "Pay with Wallet"
          )}
        </button>
      </div>
    </div>
  );
};

export default WalletPaymentOption;