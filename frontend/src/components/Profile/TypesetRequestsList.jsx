import React, { useState } from 'react';
import { Trash2, FileText, MessageSquare, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TypesetStatusBadge } from '../ui/TypesetStatusBadge';
import { deleteTypesetRequest } from '../../services/typesetRequestService';

/**
 * Component to display user's typeset request history
 * @param {Object} props
 * @param {Array} props.requests - Array of typeset requests
 * @param {Function} props.onRefresh - Callback to refresh the requests list
 * @param {boolean} props.loading - Whether requests are loading
 * @returns {JSX.Element}
 */
export const TypesetRequestsList = ({ requests = [], onRefresh, loading = false }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this typeset request? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    setError('');

    try {
      await deleteTypesetRequest(id);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Error deleting typeset request:', err);
      setError(err.response?.data?.error || 'Failed to delete request');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading typeset requests...</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Typeset Requests Yet</h3>
        <p className="text-gray-600 mb-4">
          After generating a paper, you can send it for professional typesetting.
        </p>
        <p className="text-sm text-gray-500">
          Your typeset requests will appear here once you submit them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-3">
        {requests.map((request) => {
          const isExpanded = expandedId === request.id;
          const canDelete = request.status === 'Pending';
          
          return (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Main Content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  {/* Left Section - Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 truncate">
                        Request #{request.id}
                      </h4>
                      <TypesetStatusBadge status={request.status} />
                    </div>

                    {/* Paper Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-3">
                      {request.subject && (
                        <div>
                          <span className="text-gray-600">Subject:</span>
                          <span className="ml-2 font-medium text-gray-900">{request.subject}</span>
                        </div>
                      )}
                      {request.examType && (
                        <div>
                          <span className="text-gray-600">Exam:</span>
                          <span className="ml-2 font-medium text-gray-900">{request.examType}</span>
                        </div>
                      )}
                      {request.stream && (
                        <div>
                          <span className="text-gray-600">Stream:</span>
                          <span className="ml-2 font-medium text-gray-900">{request.stream}</span>
                        </div>
                      )}
                      {request.questionCount > 0 && (
                        <div>
                          <span className="text-gray-600">Questions:</span>
                          <span className="ml-2 font-medium text-gray-900">{request.questionCount}</span>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-gray-600">Requested:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Completed Date */}
                    {request.completedAt && (
                      <div className="text-sm mb-2">
                        <span className="text-gray-600">Completed:</span>
                        <span className="ml-2 font-medium text-green-700">
                          {formatDistanceToNow(new Date(request.completedAt), { addSuffix: true })}
                        </span>
                      </div>
                    )}

                    {/* Admin Notes Preview (if any) */}
                    {request.adminNotes && !isExpanded && (
                      <div className="text-sm text-gray-600 italic truncate">
                        Admin note: {request.adminNotes}
                      </div>
                    )}
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-start gap-2 ml-4">
                    {/* Expand/Collapse Button */}
                    {request.adminNotes && (
                      <button
                        onClick={() => toggleExpand(request.id)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View details"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                    )}

                    {/* Delete Button (only for pending requests) */}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(request.id)}
                        disabled={deletingId === request.id}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete request"
                      >
                        {deletingId === request.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Content - Admin Notes */}
                {isExpanded && request.adminNotes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <MessageSquare className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h5 className="font-semibold text-yellow-900 mb-1">Admin Notes</h5>
                          <p className="text-sm text-yellow-800 whitespace-pre-wrap">{request.adminNotes}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Footer */}
              <div className={`px-4 py-2 text-xs flex items-center justify-between ${
                request.status === 'Pending' ? 'bg-yellow-50' :
                request.status === 'InProgress' ? 'bg-blue-50' :
                request.status === 'Completed' ? 'bg-green-50' :
                'bg-red-50'
              }`}>
                <div className="flex items-center gap-2">
                  {request.status === 'Pending' && (
                    <>
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">Awaiting admin review</span>
                    </>
                  )}
                  {request.status === 'InProgress' && (
                    <>
                      <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                      <span className="text-blue-800 font-medium">Admin is working on your request</span>
                    </>
                  )}
                  {request.status === 'Completed' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-800 font-medium">Your paper has been typeset!</span>
                    </>
                  )}
                  {request.status === 'Rejected' && (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-800 font-medium">Request could not be processed</span>
                    </>
                  )}
                </div>
                {canDelete && (
                  <span className="text-gray-500">You can delete pending requests</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            <p className="text-gray-600">Total Requests</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'Pending').length}
            </p>
            <p className="text-gray-600">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {requests.filter(r => r.status === 'InProgress').length}
            </p>
            <p className="text-gray-600">In Progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'Completed').length}
            </p>
            <p className="text-gray-600">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypesetRequestsList;
