import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { getMyProfile, updateMyProfile, getMyActivity } from '../services/userService';
import { User, MapPin, CreditCard, Phone, UserCircle, Edit2, Save, X, Mail, ArrowLeft, FileText, TrendingUp, Clock, CheckCircle, Calendar, Upload, Crown, UserRound, UserCircle2, Download, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TypesetRequestsList } from '../components/Profile/TypesetRequestsList';
import { useTypesetRequests } from '../hooks/useTypesetRequests';

const districts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa",
  "Colombo", "Galle", "Gampaha", "Hambantota",
  "Jaffna", "Kalutara", "Kandy", "Kegalle",
  "Kilinochchi", "Kurunegala", "Mannar", "Matale",
  "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee",
  "Vavuniya"
];

const UserProfile = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activityStats, setActivityStats] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    district: '',
    nic: '',
    telephoneNo: '',
    gender: '',
    email: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Typeset Requests
  const { requests: typesetRequests, loading: loadingTypesets, refreshRequests } = useTypesetRequests();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getMyProfile();
        setProfile(data);
        setFormData({
          fullName: data.fullName || '',
          district: data.district || '',
          nic: data.nic || '',
          telephoneNo: data.telephoneNo || '',
          gender: data.gender || '',
          email: data.email || user.email || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Fetch activity statistics
  useEffect(() => {
    const fetchActivity = async () => {
      if (!profile) return;
      
      try {
        setLoadingActivity(true);
        const stats = await getMyActivity();
        setActivityStats(stats);
      } catch (err) {
        console.error('Error fetching activity stats:', err);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivity();
  }, [profile]);

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

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    setErrors({});
    // Reset form data to original profile data
    setFormData({
      fullName: profile.fullName || '',
      district: profile.district || '',
      nic: profile.nic || '',
      telephoneNo: profile.telephoneNo || '',
      gender: profile.gender || '',
      email: profile.email || user.email || ''
    });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const updatedData = {
        fullName: formData.fullName.trim(),
        district: formData.district,
        nic: formData.nic.trim(),
        telephoneNo: formData.telephoneNo.trim(),
        gender: formData.gender,
        email: formData.email
      };

      await updateMyProfile(updatedData);
      
      // Refresh profile in context
      await refreshProfile();
      
      // Fetch updated profile
      const updatedProfile = await getMyProfile();
      setProfile(updatedProfile);
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="text-gray-600 font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load your profile.</p>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                profile.role?.toLowerCase() === 'admin' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                {profile.role?.toLowerCase() === 'admin' ? (
                  <Crown className="h-10 w-10 text-white" />
                ) : profile.gender === 'Male' ? (
                  <UserRound className="h-10 w-10 text-white" />
                ) : profile.gender === 'Female' ? (
                  <UserCircle2 className="h-10 w-10 text-white" />
                ) : (
                  <User className="h-10 w-10 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{profile.fullName || 'User Profile'}</h1>
                <p className="text-lg text-gray-600">{profile.email}</p>
                {profile.role && (
                  <span className={`inline-block mt-2 px-3 py-1 text-sm font-semibold rounded-full ${
                    profile.role.toLowerCase() === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                )}
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Edit2 className="h-5 w-5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Combined Profile & Activity Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Profile Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Full Name */}
            <div>
              <label className="text-gray-600 text-sm">Full Name</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                      errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>
              ) : (
                <p className="font-medium text-gray-900 mt-1">{profile.fullName || 'Not provided'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-gray-600 text-sm">Email</label>
              <p className="font-medium text-gray-900 mt-1">{profile.email || 'Not provided'}</p>
            </div>

            {/* District */}
            <div>
              <label className="text-gray-600 text-sm">District</label>
              {isEditing ? (
                <div>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                      errors.district ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="mt-1 text-sm text-red-600">{errors.district}</p>
                  )}
                </div>
              ) : (
                <p className="font-medium text-gray-900 mt-1">{profile.district || 'Not provided'}</p>
              )}
            </div>

            {/* NIC */}
            <div>
              <label className="text-gray-600 text-sm">NIC</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="nic"
                    value={formData.nic}
                    onChange={handleChange}
                    className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                      errors.nic ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.nic && (
                    <p className="mt-1 text-sm text-red-600">{errors.nic}</p>
                  )}
                </div>
              ) : (
                <p className="font-medium text-gray-900 mt-1">{profile.nic || 'Not provided'}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-gray-600 text-sm">Telephone</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="telephoneNo"
                    value={formData.telephoneNo}
                    onChange={handleChange}
                    className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                      errors.telephoneNo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.telephoneNo && (
                    <p className="mt-1 text-sm text-red-600">{errors.telephoneNo}</p>
                  )}
                </div>
              ) : (
                <p className="font-medium text-gray-900 mt-1">{profile.telephoneNo || 'Not provided'}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="text-gray-600 text-sm">Gender</label>
              {isEditing ? (
                <div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                      errors.gender ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>
              ) : (
                <p className="font-medium text-gray-900 mt-1">{profile.gender || 'Not provided'}</p>
              )}
            </div>
          </div>

          {/* Activity Statistics */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Statistics
            </h3>
          
          {loadingActivity ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activityStats ? (
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className={`grid grid-cols-1 gap-4 ${profile.role?.toLowerCase() === 'admin' ? 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'md:grid-cols-3 lg:grid-cols-5'}`}>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-900 font-medium">Papers Generated</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{activityStats.totalPapersGenerated}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-900 font-medium">Questions Used</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{activityStats.totalQuestionsUsed}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <p className="text-sm text-purple-900 font-medium">Last Activity</p>
                  </div>
                  <p className="text-sm font-semibold text-purple-600">
                    {activityStats.lastPaperGeneratedAt 
                      ? formatDistanceToNow(new Date(activityStats.lastPaperGeneratedAt), { addSuffix: true })
                      : 'Never'}
                  </p>
                </div>

                <div className="bg-cyan-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-5 w-5 text-cyan-600" />
                    <p className="text-sm text-cyan-900 font-medium">Papers Downloaded</p>
                  </div>
                  <p className="text-3xl font-bold text-cyan-600">{activityStats.totalPapersDownloaded || 0}</p>
                </div>

                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-5 w-5 text-teal-600" />
                    <p className="text-sm text-teal-900 font-medium">Markings Downloaded</p>
                  </div>
                  <p className="text-3xl font-bold text-teal-600">{activityStats.totalMarkingsDownloaded || 0}</p>
                </div>

                {/* Admin-only statistics */}
                {profile.role?.toLowerCase() === 'admin' && (
                  <>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="h-5 w-5 text-orange-600" />
                        <p className="text-sm text-orange-900 font-medium">Questions Uploaded</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">{activityStats.totalQuestionsUploaded || 0}</p>
                    </div>

                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="h-5 w-5 text-indigo-600" />
                        <p className="text-sm text-indigo-900 font-medium">Typesets Uploaded</p>
                      </div>
                      <p className="text-3xl font-bold text-indigo-600">{activityStats.totalTypesetsUploaded || 0}</p>
                    </div>

                    <div className="bg-rose-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="h-5 w-5 text-rose-600" />
                        <p className="text-sm text-rose-900 font-medium">Papers Uploaded</p>
                      </div>
                      <p className="text-3xl font-bold text-rose-600">{activityStats.totalPapersUploaded || 0}</p>
                    </div>

                    <div className="bg-pink-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="h-5 w-5 text-pink-600" />
                        <p className="text-sm text-pink-900 font-medium">Markings Uploaded</p>
                      </div>
                      <p className="text-3xl font-bold text-pink-600">{activityStats.totalMarkingsUploaded || 0}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Most Recent Paper */}
              {activityStats.recentPapers?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Most Recent Paper</h4>
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activityStats.recentPapers[0].paperTitle || `Paper #${activityStats.recentPapers[0].id}`}</p>
                      <p className="text-sm text-gray-600">
                        {activityStats.recentPapers[0].totalQuestions} questions • {formatDistanceToNow(new Date(activityStats.recentPapers[0].generatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Recent Downloads */}
              {activityStats.recentDownloads?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Downloads</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activityStats.recentDownloads.map((download) => (
                      <div key={download.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              download.resourceType === 'paper' 
                                ? 'bg-cyan-100 text-cyan-800' 
                                : 'bg-teal-100 text-teal-800'
                            }`}>
                              {download.resourceType === 'paper' ? 'Paper' : 'Marking'}
                            </span>
                            <p className="font-medium text-gray-900">
                              {download.subject || 'Unknown'} - {download.country || 'Unknown'} {download.year || ''}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            Downloaded {formatDistanceToNow(new Date(download.downloadedAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Download className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Uploads (Admin Only) */}
              {profile.role?.toLowerCase() === 'admin' && activityStats.recentUploads?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Uploads</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activityStats.recentUploads.map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              upload.resourceType === 'paper' 
                                ? 'bg-rose-100 text-rose-800' 
                                : 'bg-pink-100 text-pink-800'
                            }`}>
                              {upload.resourceType === 'paper' ? 'Paper' : 'Marking'}
                            </span>
                            <p className="font-medium text-gray-900">
                              {upload.subject || 'Unknown'} - {upload.country || 'Unknown'} {upload.year || ''}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {upload.examType} • Uploaded {formatDistanceToNow(new Date(upload.uploadDate), { addSuffix: true })}
                          </p>
                        </div>
                        <Upload className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Dates */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Account Created</p>
                    <p className="font-medium text-gray-900">{new Date(profile.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Profile Update</p>
                    <p className="font-medium text-gray-900">{new Date(profile.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No activity data available</p>
            </div>
          )}
          </div>

          {/* Typeset Requests Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              My Typeset Requests
            </h3>
            <TypesetRequestsList 
              requests={typesetRequests} 
              loading={loadingTypesets}
              onRefresh={refreshRequests}
            />
          </div>

          {/* Edit Mode Actions */}
          {isEditing && (
            <div className="flex justify-end space-x-4 mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default UserProfile;
