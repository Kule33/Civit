import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { 
  getAllProfiles, 
  updateProfile, 
  changeUserRole,
  getUserActivity 
} from '../../services/userService';
import { 
  Users as UsersIcon, 
  Shield, 
  GraduationCap, 
  CheckCircle, 
  Search, 
  Filter,
  Eye,
  Edit,
  RefreshCw,
  X,
  Save,
  UserCircle,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Upload,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Sri Lankan Districts
const districts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa",
  "Colombo", "Galle", "Gampaha", "Hambantota",
  "Jaffna", "Kalutara", "Kandy", "Kegalle",
  "Kilinochchi", "Kurunegala", "Mannar", "Matale",
  "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee",
  "Vavuniya"
];

// Utility Functions
const maskNIC = (nic) => {
  if (nic.length === 10) { // Old format
    return nic.substring(0, 3) + '-XXXX-XX' + nic.substring(8);
  } else if (nic.length === 12) { // New format
    return nic.substring(0, 4) + '-XXXX-' + nic.substring(10);
  }
  return nic;
};

const maskPhone = (phone) => {
  if (phone.length === 12) {
    return phone.substring(0, 4) + 'XX-XXX-XX' + phone.substring(10);
  }
  return phone;
};

const Users = () => {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Modals
  const [viewModal, setViewModal] = useState({ open: false, user: null });
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [roleModal, setRoleModal] = useState({ open: false, user: null });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5; // ⚡ OPTIMIZATION: Only 5 rows per page for better performance

  useEffect(() => {
    console.log('Users component - isAdmin:', isAdmin);
    if (!isAdmin) {
      console.log('Not admin, skipping profile fetch');
      return;
    }
    console.log('Admin confirmed, fetching profiles...');
    fetchProfiles();
  }, [isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [profiles, searchTerm, districtFilter, genderFilter, roleFilter]);

  const fetchProfiles = async () => {
    console.log('fetchProfiles called');
    setLoading(true);
    try {
      console.log('Calling getAllProfiles API...');
      const data = await getAllProfiles();
      console.log('Profiles fetched:', data?.length || 0, 'profiles');
      setProfiles(data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...profiles];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // District filter
    if (districtFilter) {
      filtered = filtered.filter(p => p.district === districtFilter);
    }

    // Gender filter
    if (genderFilter) {
      filtered = filtered.filter(p => p.gender === genderFilter);
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter(p => p.role === roleFilter);
    }

    setFilteredProfiles(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDistrictFilter('');
    setGenderFilter('');
    setRoleFilter('');
  };

  // Statistics
  const totalUsers = profiles.length;
  const totalAdmins = profiles.filter(p => p.role === 'admin').length;
  const totalTeachers = profiles.filter(p => p.role === 'teacher').length;

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredProfiles.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredProfiles.length / usersPerPage);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">View and manage all registered users</p>
          </div>
          <button
            onClick={fetchProfiles}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={UsersIcon}
          gradient="from-blue-500 to-purple-500"
        />
        <StatCard
          title="Admins"
          value={totalAdmins}
          icon={Shield}
          gradient="from-red-500 to-orange-500"
        />
        <StatCard
          title="Teachers"
          value={totalTeachers}
          icon={GraduationCap}
          gradient="from-green-500 to-teal-500"
        />
        <StatCard
          title="Profiles Complete"
          value={totalUsers}
          icon={CheckCircle}
          gradient="from-indigo-500 to-violet-500"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or NIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* District Filter */}
          <div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || districtFilter || genderFilter || roleFilter) && (
          <button
            onClick={clearFilters}
            className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Filter className="h-4 w-4" />
            Clear all filters
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : currentUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">District</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NIC</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.district}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{maskNIC(user.nic)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{maskPhone(user.telephoneNo)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.gender === 'Male' ? 'bg-blue-100 text-blue-800' :
                          user.gender === 'Female' ? 'bg-pink-100 text-pink-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {user.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? '🟣 Admin' : '🔵 Teacher'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewModal({ open: true, user })}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditModal({ open: true, user })}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setRoleModal({ open: true, user })}
                            className="text-purple-600 hover:text-purple-800 p-1"
                            title="Change Role"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredProfiles.length)} of {filteredProfiles.length} users
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 border rounded-lg ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {viewModal.open && (
        <ViewUserModal
          user={viewModal.user}
          onClose={() => setViewModal({ open: false, user: null })}
        />
      )}

      {editModal.open && (
        <EditUserModal
          user={editModal.user}
          onClose={() => setEditModal({ open: false, user: null })}
          onSave={() => {
            setEditModal({ open: false, user: null });
            fetchProfiles();
          }}
        />
      )}

      {roleModal.open && (
        <ChangeRoleModal
          user={roleModal.user}
          onClose={() => setRoleModal({ open: false, user: null })}
          onConfirm={() => {
            setRoleModal({ open: false, user: null });
            fetchProfiles();
          }}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, gradient }) => (
  <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
    <div className="relative p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">{title}</p>
          <p className={`text-4xl font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  </div>
);

// View User Modal Component (Matches UserProfile.jsx layout with edit functionality)
const ViewUserModal = ({ user, onClose }) => {
  const [activityStats, setActivityStats] = React.useState(null);
  const [loadingActivity, setLoadingActivity] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [formData, setFormData] = React.useState({
    fullName: user.fullName,
    district: user.district,
    nic: user.nic,
    telephoneNo: user.telephoneNo,
    gender: user.gender
  });
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoadingActivity(true);
        const stats = await getUserActivity(user.id);
        setActivityStats(stats);
      } catch (error) {
        console.error('Error loading activity stats:', error);
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchActivity();
  }, [user.id]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      newErrors.fullName = 'Full name must be between 2 and 100 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName)) {
      newErrors.fullName = 'Full name must contain only letters and spaces';
    }

    if (!formData.district) {
      newErrors.district = 'District is required';
    }

    if (!formData.nic.trim()) {
      newErrors.nic = 'NIC is required';
    } else if (!/^([0-9]{9}[VvXx]|[0-9]{12})$/.test(formData.nic)) {
      newErrors.nic = 'Invalid NIC format. Use 9 digits + V or 12 digits';
    }

    if (!formData.telephoneNo.trim()) {
      newErrors.telephoneNo = 'Phone number is required';
    } else if (!/^\+94[0-9]{9}$/.test(formData.telephoneNo)) {
      newErrors.telephoneNo = 'Phone must be +94 followed by 9 digits (e.g., +94771234567)';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setFormData({
      fullName: user.fullName,
      district: user.district,
      nic: user.nic,
      telephoneNo: user.telephoneNo,
      gender: user.gender
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
        gender: formData.gender
      };

      await updateProfile(user.id, updatedData);
      
      // Update local user object
      Object.assign(user, updatedData);
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.fullName || 'User Profile'}</h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role === 'admin' ? 'Administrator' : 'Teacher'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
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

          {/* Profile Details */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
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
                  <p className="font-medium text-gray-900 mt-1">{user.fullName || 'Not provided'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-gray-600 text-sm">Email</label>
                <p className="font-medium text-gray-900 mt-1">{user.email || 'Not provided'}</p>
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
                  <p className="font-medium text-gray-900 mt-1">{user.district || 'Not provided'}</p>
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
                  <p className="font-medium text-gray-900 mt-1">{user.nic || 'Not provided'}</p>
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
                  <p className="font-medium text-gray-900 mt-1">{user.telephoneNo || 'Not provided'}</p>
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
                  <p className="font-medium text-gray-900 mt-1">{user.gender || 'Not provided'}</p>
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
                  <div className={`grid grid-cols-1 gap-4 ${user.role === 'admin' ? 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'md:grid-cols-3 lg:grid-cols-5'}`}>
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
                    {user.role === 'admin' && (
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

                  {/* All Generated Papers */}
                  {activityStats.recentPapers?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">All Generated Papers</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {activityStats.recentPapers.map((paper) => (
                          <div key={paper.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{paper.paperTitle || `Paper #${paper.id}`}</p>
                              <p className="text-sm text-gray-600">
                                {paper.totalQuestions} questions • {formatDistanceToNow(new Date(paper.generatedAt), { addSuffix: true })}
                              </p>
                            </div>
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                        ))}
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
                  {user.role === 'admin' && activityStats.recentUploads?.length > 0 && (
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
                        <p className="font-medium text-gray-900">{new Date(user.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Profile Update</p>
                        <p className="font-medium text-gray-900">{new Date(user.updatedAt).toLocaleString()}</p>
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

        {/* Footer - Only show Close button when not editing */}
        {!isEditing && (
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    district: user.district,
    nic: user.nic,
    telephoneNo: user.telephoneNo,
    gender: user.gender
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim() || !/^[a-zA-Z\s]{2,100}$/.test(formData.fullName)) {
      newErrors.fullName = 'Invalid full name';
    }

    if (!formData.district || !districts.includes(formData.district)) {
      newErrors.district = 'Invalid district';
    }

    if (!/^([0-9]{9}[VvXx]|[0-9]{12})$/.test(formData.nic)) {
      newErrors.nic = 'Invalid NIC format';
    }

    if (!/^\+94[0-9]{9}$/.test(formData.telephoneNo)) {
      newErrors.telephoneNo = 'Invalid phone format';
    }

    if (!['Male', 'Female', 'Other'].includes(formData.gender)) {
      newErrors.gender = 'Invalid gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await updateProfile(user.id, formData);
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Edit User Profile</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Read-only)</label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errors.fullName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
            />
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errors.district ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
            >
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">NIC</label>
            <input
              type="text"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errors.nic ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
            />
            {errors.nic && <p className="mt-1 text-sm text-red-600">{errors.nic}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Telephone</label>
            <input
              type="tel"
              name="telephoneNo"
              value={formData.telephoneNo}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errors.telephoneNo ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
            />
            {errors.telephoneNo && <p className="mt-1 text-sm text-red-600">{errors.telephoneNo}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
            <div className="flex gap-6">
              {['Male', 'Female', 'Other'].map(g => (
                <label key={g} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={formData.gender === g}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">{g}</span>
                </label>
              ))}
            </div>
            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Change Role Modal Component
const ChangeRoleModal = ({ user, onClose, onConfirm }) => {
  const [newRole, setNewRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (newRole === user.role) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await changeUserRole(user.id, newRole);
      onConfirm();
    } catch (err) {
      setError(err.message || 'Failed to change role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Change User Role</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-2">User: <span className="font-medium text-gray-900">{user.fullName}</span></p>
            <p className="text-sm text-gray-600 mb-4">Current Role: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{user.role}</span></p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select New Role</label>
            <div className="space-y-3">
              {['admin', 'teacher'].map(role => (
                <label key={role} className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: newRole === role ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={newRole === role}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900 capitalize">{role}</p>
                    <p className="text-xs text-gray-500">
                      {role === 'admin' ? 'Full access to all features' : 'Access to teaching features'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Changing user role will affect their permissions immediately.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || newRole === user.role}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing...' : 'Confirm Change'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
