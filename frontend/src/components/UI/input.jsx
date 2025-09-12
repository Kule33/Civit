import React from 'react';

const Input = ({
  className = '',
  ...props
}) => {
  return (
    <input
      className={`
        w-full px-4 py-2 border border-gray-300 rounded-lg 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
        transition-colors duration-200
        ${className}
      `}
      {...props}
    />
  );
};

export { Input };
export default Input;