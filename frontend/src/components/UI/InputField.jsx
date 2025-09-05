import React from 'react';

const InputField = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2 border border-gray-300 rounded-lg 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          transition-colors duration-200
          ${error ? 'border-red-500' : ''}
        `}
        {...props}
      />
      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-gray-500 text-sm mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default InputField;