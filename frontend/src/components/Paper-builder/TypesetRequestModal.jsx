import React, { useState } from 'react';
import { X, Send, FileText } from 'lucide-react';
import Button from '../ui/Button';

const MAX_MESSAGE_LENGTH = 500;

/**
 * Modal component for submitting typeset requests
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSubmit - Callback when request is submitted
 * @param {Object} props.paperMetadata - Paper metadata (subject, examType, questionCount, etc.)
 * @param {string} props.tempFilePath - Temp file path from backend
 * @param {boolean} props.isSubmitting - Whether submission is in progress
 * @returns {JSX.Element|null}
 */
export const TypesetRequestModal = ({
  isOpen,
  onClose,
  onSubmit,
  paperMetadata = {},
  tempFilePath,
  isSubmitting = false,
}) => {
  const [userMessage, setUserMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate message length
    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Message must be ${MAX_MESSAGE_LENGTH} characters or less`);
      return;
    }

    // Call parent submit handler
    try {
      await onSubmit({
        paperFilePath: tempFilePath,
        userMessage: userMessage.trim() || null,
        paperMetadata: JSON.stringify(paperMetadata),
      });
      // Reset form
      setUserMessage('');
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    }
  };

  const handleClose = () => {
    setUserMessage('');
    setError('');
    onClose();
  };

  const remainingChars = MAX_MESSAGE_LENGTH - userMessage.length;
  const isMessageTooLong = remainingChars < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Send for Typesetting</h2>
              <p className="text-sm text-gray-600">Request professional typesetting for your paper</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Paper Details Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Paper Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {paperMetadata.subject && (
                <div>
                  <span className="text-gray-600">Subject:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {typeof paperMetadata.subject === 'object' ? paperMetadata.subject.name || paperMetadata.subject.label || JSON.stringify(paperMetadata.subject) : paperMetadata.subject}
                  </span>
                </div>
              )}
              {paperMetadata.examType && (
                <div>
                  <span className="text-gray-600">Exam Type:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {typeof paperMetadata.examType === 'object' ? paperMetadata.examType.name || paperMetadata.examType.label || JSON.stringify(paperMetadata.examType) : paperMetadata.examType}
                  </span>
                </div>
              )}
              {paperMetadata.stream && (
                <div>
                  <span className="text-gray-600">Stream:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {typeof paperMetadata.stream === 'object' ? paperMetadata.stream.name || paperMetadata.stream.label || JSON.stringify(paperMetadata.stream) : paperMetadata.stream}
                  </span>
                </div>
              )}
              {paperMetadata.questionCount && (
                <div>
                  <span className="text-gray-600">Questions:</span>
                  <span className="ml-2 font-medium text-gray-900">{paperMetadata.questionCount}</span>
                </div>
              )}
              {paperMetadata.totalMarks && (
                <div>
                  <span className="text-gray-600">Total Marks:</span>
                  <span className="ml-2 font-medium text-gray-900">{paperMetadata.totalMarks}</span>
                </div>
              )}
              {paperMetadata.generatedAt && (
                <div>
                  <span className="text-gray-600">Generated:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(paperMetadata.generatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Message Input */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="userMessage" className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <textarea
                id="userMessage"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Add any special formatting requests, corrections, or notes for the admin..."
                rows={5}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
                  isMessageTooLong ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Your message will be sent to the admin along with your paper
                </p>
                <p
                  className={`text-sm font-medium ${
                    isMessageTooLong
                      ? 'text-red-600'
                      : remainingChars < 50
                      ? 'text-yellow-600'
                      : 'text-gray-500'
                  }`}
                >
                  {remainingChars} characters remaining
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your paper will be sent to our admin team</li>
                <li>• You'll receive a confirmation email shortly</li>
                <li>• Track your request status in your profile</li>
                <li>• Expected turnaround: 2-3 business days</li>
              </ul>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isMessageTooLong}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Request</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TypesetRequestModal;
