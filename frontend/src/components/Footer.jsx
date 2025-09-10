import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Heart } from 'lucide-react';

const Footer = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleFooter = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <footer className={`bg-white border-t border-gray-200 transition-all duration-300 overflow-hidden ${isExpanded ? 'py-4' : 'py-2'}`}>
      {/* Collapse toggle button at the TOP */}
      <div 
        className="flex items-center justify-center py-1 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleFooter}
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronUp size={16} className="text-gray-500" />
        )}
      </div>

      {/* Default footer content (always visible) */}
      <div className="px-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-600 mb-2 md:mb-0">
            © 2025 Paper Master. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
          </div>
        </div>
      </div>

      {/* Expanded content with CVIT information (shown when expanded) */}
      {isExpanded && (
        <div className="px-6 mt-3 pt-3 border-t border-gray-100 animate-fadeIn">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <span>Built with</span>
              <Heart size={14} className="mx-1 text-red-500 fill-current" />
              <span>by the CVIT Team</span>
            </div>
            <p className="text-xs text-gray-500">
              CVIT - Creating Value Through Innovative Technology
            </p>
            <p className="text-xs text-gray-500">
              Specializing in educational technology solutions
            </p>
            <a 
              href="https://cvit.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Visit our website →
            </a>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;