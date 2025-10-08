// frontend/src/routes/Admin/TypesetUpload.jsx
import React, { useState } from 'react';
import { FileText, Upload, Search } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import InputField from '../../components/ui/InputField.jsx';
import { upsertTypeset } from '../../services/typesetService';
import { uploadRawWithProgress } from '../../services/cloudinaryService';
import { supabase } from '../../supabaseClient';
import { useSubmission } from '../../context/SubmissionContext';

const TypesetUpload = () => {
  const [questionId, setQuestionId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showOverlay } = useSubmission();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        showOverlay({
          status: 'error',
          message: 'Only .doc, .docx, and .pdf files are allowed',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showOverlay({
          status: 'error',
          message: 'File size must be less than 10MB',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    try {
      if (!questionId) {
        showOverlay({
          status: 'error',
          message: 'Please enter a Question ID',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      if (!selectedFile) {
        showOverlay({
          status: 'error',
          message: 'Please select a file to upload',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      setUploading(true);
      showOverlay({
        status: 'loading',
        message: 'Uploading typeset file to Cloudinary...',
        autoClose: false
      });

      // Get Supabase JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Upload file to Cloudinary as raw (DOCX/PDF)
      const cloudinaryResult = await uploadRawWithProgress(
        selectedFile,
        'typesets',
        (progress) => {
          showOverlay({
            status: 'loading',
            message: `Uploading to Cloudinary... ${progress}%`,
            autoClose: false
          });
        }
      );

      showOverlay({
        status: 'loading',
        message: 'Saving typeset reference to database...',
        autoClose: false
      });

      // Save typeset reference to backend
      const result = await upsertTypeset(
        {
          questionId: questionId,
          fileUrl: cloudinaryResult.secureUrl,
          filePublicId: cloudinaryResult.publicId,
          fileName: cloudinaryResult.fileName
        },
        token
      );

      showOverlay({
        status: 'success',
        message: `Typeset uploaded successfully! Version: ${result.version}`,
        autoClose: true,
        autoCloseDelay: 3000
      });

      // Reset form
      setQuestionId('');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('typeset-file-input');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Typeset upload error:', error);
      showOverlay({
        status: 'error',
        message: error.response?.data?.message || error.message || 'Failed to upload typeset',
        autoClose: true,
        autoCloseDelay: 5000
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Typeset Upload"
        subtitle="Upload typeset documents (DOCX/PDF) for question screenshots (Admin Only)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Upload Typeset File</h2>
          <div className="space-y-4">
            <InputField
              label="Question ID *"
              placeholder="Paste the Question ID here (e.g., 3fa85f64-5717-4562-b3fc-2c963f66afa6)"
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              disabled={uploading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Typeset File (.doc, .docx, .pdf) *
              </label>
              <input
                id="typeset-file-input"
                type="file"
                accept=".doc,.docx,.pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Button
              variant="primary"
              size="large"
              icon={Upload}
              onClick={handleUpload}
              disabled={uploading || !questionId || !selectedFile}
              className="w-full"
            >
              {uploading ? 'Uploading...' : 'Upload Typeset'}
            </Button>
          </div>
        </Card>

        {/* Instructions */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Instructions</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start space-x-2">
              <Search className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">1. Find the Question ID</p>
                <p className="text-gray-600">
                  Go to Manage Question section or generated paper, search for your question, and click the 
                  <strong className="text-gray-900"> "Question ID" </strong> 
                  link. Paste it below.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <FileText className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">2. Select Typeset File</p>
                <p className="text-gray-600">
                  Choose the typeset document that corresponds to the question screenshot. 
                  Only .doc, .docx, and .pdf files are supported (max 10MB).
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Upload className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">3. Upload</p>
                <p className="text-gray-600">
                  Click "Upload Typeset" to save the file. If a typeset already exists for 
                  this question, it will be replaced and the version number will increment.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Tip:</strong> The <strong>"Copy Question ID"</strong> button is located at the bottom of each question card. 
                The Question ID is a unique code like <code className="bg-blue-100 px-1 rounded">3fa85f64-5717-4562-b3fc-2c963f66afa6</code>
              </p>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Only administrators can upload typeset files. 
                Teachers can view and download typesets in the Paper Builder.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TypesetUpload;