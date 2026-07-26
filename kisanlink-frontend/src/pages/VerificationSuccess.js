// src/pages/VerificationSuccess.js
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const VerificationSuccess = () => {
  useEffect(() => {
    // Optionally check verification status
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    
    if (email) {
      // You could verify here, but backend handles it
      console.log(`Email ${email} verified successfully`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-gray-600">
            Your email has been successfully verified.
          </p>
        </div>
        
        <div className="mb-8">
          <p className="text-gray-700 mb-4">
            You can now login to your KisanLink account and start using all features.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Tip:</strong> Keep your login credentials secure and never share them.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/login"
            className="block w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
          >
            Go to Login
          </Link>
          
          <Link
            to="/"
            className="block w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccess;
