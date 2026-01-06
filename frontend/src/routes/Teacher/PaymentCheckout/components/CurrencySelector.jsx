import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { CURRENCIES } from "../constants";

const CurrencySelector = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 transition shadow-sm"
      >
        <img src={selected.flag} alt={selected.code} className="w-5 h-5 rounded-full object-cover" />
        <span className="text-sm font-bold text-gray-800">{selected.code}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 min-w-[220px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-64 overflow-y-auto">
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => {
                  onSelect(currency);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition text-left ${
                  selected.code === currency.code ? "bg-purple-50" : ""
                }`}
              >
                <img src={currency.flag} alt={currency.code} className="w-6 h-6 rounded-full object-cover border border-gray-100" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{currency.code}</div>
                  <div className="text-xs text-gray-500">{currency.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;