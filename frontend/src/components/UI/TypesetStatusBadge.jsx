import React from 'react';
import { Badge } from './badge';

/**
 * Badge component to display typeset request status with appropriate colors
 * @param {Object} props
 * @param {string} props.status - Request status (Pending, InProgress, Completed, Rejected)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export const TypesetStatusBadge = ({ status, className = '' }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Pending':
        return {
          variant: 'warning',
          icon: '⏳',
          label: 'Pending',
          description: 'Your request is waiting to be processed',
          colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        };
      case 'InProgress':
        return {
          variant: 'info',
          icon: '🔄',
          label: 'In Progress',
          description: 'Admin is currently working on your request',
          colorClass: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'Completed':
        return {
          variant: 'success',
          icon: '✅',
          label: 'Completed',
          description: 'Your paper has been typeset and is ready',
          colorClass: 'bg-green-100 text-green-800 border-green-300',
        };
      case 'Rejected':
        return {
          variant: 'destructive',
          icon: '❌',
          label: 'Rejected',
          description: 'Request could not be processed',
          colorClass: 'bg-red-100 text-red-800 border-red-300',
        };
      default:
        return {
          variant: 'default',
          icon: '📄',
          label: status || 'Unknown',
          description: 'Status information unavailable',
          colorClass: 'bg-gray-100 text-gray-800 border-gray-300',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="group relative inline-block">
      <Badge
        variant={config.variant}
        className={`${config.colorClass} border px-3 py-1 text-sm font-medium ${className}`}
      >
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max max-w-xs">
        <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg">
          {config.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypesetStatusBadge;
