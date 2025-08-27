import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
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
    </footer>
  );
};

export default Footer;