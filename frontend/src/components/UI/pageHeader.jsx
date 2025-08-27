import React from 'react';

const pageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
      {children}
    </div>
  );
};

export default pageHeader;