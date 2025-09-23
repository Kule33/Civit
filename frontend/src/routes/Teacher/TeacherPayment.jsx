import React from 'react';
import { CreditCard, Clock } from 'lucide-react';

const PaymentComingSoon = () => {
  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-blue-50/80 via-white/90 to-indigo-50/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100/50 p-12 text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100/60 to-indigo-100/60 border border-blue-200/30">
            <CreditCard className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <h3 className="text-2xl font-semibold text-gray-800">
            Payment Features Coming Soon
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            We're developing a comprehensive payment system for educators to track earnings and manage transactions.
          </p>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center px-4 py-2 bg-blue-100/70 rounded-full border border-blue-200/50">
          <Clock className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-700">In Development</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentComingSoon;