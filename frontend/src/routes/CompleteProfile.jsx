import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { createProfile } from '../services/userService';
import { User, MapPin, CreditCard, Phone, UserCircle } from 'lucide-react';

const districts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa",
  "Colombo", "Galle", "Gampaha", "Hambantota",
  "Jaffna", "Kalutara", "Kandy", "Kegalle",
  "Kilinochchi", "Kurunegala", "Mannar", "Matale",
  "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee",
  "Vavuniya"
];

const CompleteProfile = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    district: '',
    nic: '',
    telephoneNo: '+94',
    gender: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Redirect if profile already exists
  useEffect(() => {
    if (userProfile) {
      console.log('CompleteProfile: User already has profile, redirecting to dashboard');
      navigate('/teacher/dashboard', { replace: true });
    }
  }, [userProfile, navigate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      console.log('CompleteProfile: User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Don't render form if user already has profile (prevent flash)
  if (userProfile) {
    return null;
  }

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      newErrors.fullName = 'Full name must be between 2 and 100 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName)) {
      newErrors.fullName = 'Full name must contain only letters and spaces';
    }

    // District validation
    if (!formData.district) {
      newErrors.district = 'District is required';
    }

    // NIC validation
    if (!formData.nic.trim()) {
      newErrors.nic = 'NIC is required';
    } else if (!/^([0-9]{9}[VvXx]|[0-9]{12})$/.test(formData.nic)) {
      newErrors.nic = 'Invalid NIC format. Use 9 digits + V or 12 digits';
    }

    // Phone validation
    if (!formData.telephoneNo.trim()) {
      newErrors.telephoneNo = 'Phone number is required';
    } else if (!/^\+94[0-9]{9}$/.test(formData.telephoneNo)) {
      newErrors.telephoneNo = 'Phone must be +94 followed by 9 digits (e.g., +94771234567)';
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        email: user.email,
        fullName: formData.fullName.trim(),
        district: formData.district,
        nic: formData.nic.trim(),
        telephoneNo: formData.telephoneNo.trim(),
        gender: formData.gender
      };

      await createProfile(profileData);
      
      // Refresh profile in context
      await refreshProfile();
      
      // Redirect to dashboard
      navigate('/teacher/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      setGeneralError(error.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-lg text-gray-600">We need a few more details to get you started</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {generalError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{generalError}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border ${errors.fullName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            {/* District */}
            <div>
              <label htmlFor="district" className="block text-sm font-semibold text-gray-700 mb-2">
                District <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border ${errors.district ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white`}
                >
                  <option value="">Select your district</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
            </div>

            {/* NIC */}
            <div>
              <label htmlFor="nic" className="block text-sm font-semibold text-gray-700 mb-2">
                NIC (National Identity Card) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="nic"
                  name="nic"
                  value={formData.nic}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border ${errors.nic ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="912345678V or 199212345678"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Enter 9 digits + V or 12 digits</p>
              {errors.nic && <p className="mt-1 text-sm text-red-600">{errors.nic}</p>}
            </div>

            {/* Telephone */}
            <div>
              <label htmlFor="telephoneNo" className="block text-sm font-semibold text-gray-700 mb-2">
                Telephone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  id="telephoneNo"
                  name="telephoneNo"
                  value={formData.telephoneNo}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border ${errors.telephoneNo ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="+94771234567"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Must start with +94 (e.g., +94771234567)</p>
              {errors.telephoneNo && <p className="mt-1 text-sm text-red-600">{errors.telephoneNo}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                {['Male', 'Female', 'Other'].map(gender => (
                  <label key={gender} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">{gender}</span>
                  </label>
                ))}
              </div>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Profile...
                </span>
              ) : (
                'Complete Profile'
              )}
            </button>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            All fields marked with <span className="text-red-500">*</span> are required
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
