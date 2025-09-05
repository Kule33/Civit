import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'medium',
  hover = false,
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };
  
  const classes = `
    bg-white rounded-xl shadow-sm border border-gray-200 
    ${paddingClasses[padding]} 
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${className}
  `;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;