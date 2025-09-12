import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 text-gray-600 bg-transparent',
    destructive: 'bg-red-100 text-red-800',
  };

  const classes = `
    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
    ${variants[variant] || variants.default}
    ${className}
  `;

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export { Badge };
export default Badge;