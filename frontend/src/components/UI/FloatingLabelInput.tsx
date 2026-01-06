
import React, { useState } from 'react';

interface FloatingLabelInputProps {
  label: string;
  placeholder?: string;
  initialValue?: string;
  isError?: boolean;
  isOk?: boolean;
  onChange?: (value: string) => void;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  placeholder = '',
  initialValue = '',
  isError = false,
  isOk = false,
  onChange
}) => {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const getBorderColor = () => {
    if (isError) return 'border-red-500';
    if (isOk) return 'border-green-500';
    if (isFocused) return 'border-blue-500';
    return 'border-gray-300';
  };

  const getLabelColor = () => {
    if (isError) return 'text-red-500';
    if (isOk) return 'text-green-500';
    if (isFocused) return 'text-blue-500';
    return 'text-gray-600';
  };

  const isFloating = isFocused || value.length > 0;

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? placeholder : ''}
        className={`w-full px-4 py-2 text-base border rounded-xl outline-none transition-colors duration-200 ${getBorderColor()}`}
      />
      <label
        className={`absolute left-3 px-1 text-sm transition-all bg-white duration-200 pointer-events-none ${getLabelColor()} ${
          isFloating
        ? '-top-2.5 text-xs'
        : 'top-1/2 -translate-y-1/2 text-base'
        }`}
      >
        {label}
      </label>
        </div>
  );
};