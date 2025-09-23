// src/routes/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <h1 className="text-6xl font-extrabold text-red-600 mb-4">403</h1>
      <h2 className="text-3xl font-bold mb-4">Access Denied</h2>
      <p className="text-lg text-center mb-6 max-w-md">
        You do not have the necessary permissions to view this page.
        Please contact your administrator if you believe this is an error.
      </p>
      <div className="flex space-x-4">
        <Link 
          to="/" 
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </Link>
        <Link 
          to="/login" 
          className="px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg shadow-md hover:bg-blue-50 transition-colors"
        >
          Login
        </Link>
      </div>
       <div className="mt-8">
            <img src="https://via.placeholder.com/400x200?text=Access+Denied" alt="Access Denied Illustration" className="mx-auto rounded-lg shadow-lg"/>
        </div>
    </div>
  );
};

export default Unauthorized;