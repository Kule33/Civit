import { useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';

/**
 * Advanced PDF generation hook using @react-pdf/renderer
 * Provides better formatting, styling, and image handling than jsPDF
 * 
 * @returns {Object} Object containing PDF generation function and loading state
 */
export const useAdvancedPaperGeneration = () => {
  
  // Define styles for the PDF document
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 30,
      fontFamily: 'Helvetica',
    },
    header: {
      marginBottom: 20,
      paddingBottom: 15,
      borderBottom: '2 solid #2563eb',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 12,
      color: '#6b7280',
      marginBottom: 5,
    },
    questionContainer: {
      marginBottom: 25,
      padding: 15,
      border: '1 solid #e5e7eb',
      borderRadius: 8,
      backgroundColor: '#f9fafb',
    },
    questionNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#2563eb',
      marginBottom: 8,
    },
    metadata: {
      fontSize: 10,
      color: '#6b7280',
      marginBottom: 10,
      lineHeight: 1.4,
    },
    imageContainer: {
      marginTop: 10,
      marginBottom: 10,
      alignItems: 'center',
    },
    questionImage: {
      maxWidth: '100%',
      maxHeight: 300,
      objectFit: 'contain',
    },
    imagePlaceholder: {
      width: 200,
      height: 100,
      backgroundColor: '#f3f4f6',
      border: '1 dashed #d1d5db',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '10 auto',
    },
    imagePlaceholderText: {
      fontSize: 10,
      color: '#9ca3af',
    },
    fileLink: {
      fontSize: 10,
      color: '#2563eb',
      textDecoration: 'none',
      marginTop: 5,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 30,
      right: 30,
      textAlign: 'center',
      fontSize: 8,
      color: '#9ca3af',
      borderTop: '1 solid #e5e7eb',
      paddingTop: 10,
    },
    pageNumber: {
      position: 'absolute',
      bottom: 20,
      right: 30,
      fontSize: 8,
      color: '#9ca3af',
    },
    commentContainer: {
      marginTop: 10,
      marginBottom: 10,
      padding: 8,
      backgroundColor: '#f0f9ff',
      border: '1 solid #0ea5e9',
      borderRadius: 4,
    },
    commentLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#0ea5e9',
      marginBottom: 4,
    },
    commentText: {
      fontSize: 10,
      color: '#1e40af',
      lineHeight: 1.4,
    },
    typesetBadge: {
      marginTop: 8,
      padding: 6,
      backgroundColor: '#d1fae5',
      border: '1 solid #10b981',
      borderRadius: 4,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    typesetBadgeText: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#065f46',
    },
    typesetFileName: {
      fontSize: 8,
      color: '#047857',
      marginTop: 2,
    },
    questionId: {
      fontSize: 8,
      color: '#9ca3af',
      marginTop: 4,
      fontFamily: 'Courier',
    },
    questionIdLabel: {
      fontSize: 8,
      color: '#6b7280',
      fontWeight: 'bold',
    },
  });

  /**
   * Formats metadata for display in the PDF
   * @param {Object} question - Question object containing metadata
   * @returns {string} Formatted metadata string
   */
  const formatMetadata = useCallback((question) => {
    const metadata = [];
    
    if (question.subject?.name) {
      metadata.push(`Subject: ${question.subject.name}`);
    }
    if (question.year) {
      metadata.push(`Year: ${question.year}`);
    }
    if (question.term) {
      metadata.push(`Term: ${question.term}`);
    }
    if (question.school?.name) {
      metadata.push(`School: ${question.school.name}`);
    }
    if (question.examType) {
      metadata.push(`Exam Type: ${question.examType}`);
    }
    if (question.paperCategory) {
      metadata.push(`Paper Category: ${question.paperCategory}`);
    }
    if (question.paperType) {
      metadata.push(`Paper Type: ${question.paperType}`);
    }
    
    return metadata.join(' | ');
  }, []);

  /**
   * Checks if a file URL is an image based on its extension
   * @param {string} fileUrl - File URL to check
   * @returns {boolean} True if the file is an image
   */
  const isImageFile = useCallback((fileUrl) => {
    if (!fileUrl || typeof fileUrl !== 'string') return false;
    const imageExtensions = /\.(png|jpg|jpeg|gif|webp)$/i;
    return imageExtensions.test(fileUrl);
  }, []);

  /**
   * Creates a PDF document component using @react-pdf/renderer
   * @param {Array} selectedQuestions - Array of selected question objects in order
   * @returns {JSX.Element} PDF document component
   */
  const createPDFDocument = useCallback((selectedQuestions) => {
    const currentDate = new Date().toLocaleString();
    
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Custom Question Paper</Text>
            <Text style={styles.subtitle}>Generated on: {currentDate}</Text>
            <Text style={styles.subtitle}>Total Questions: {selectedQuestions.length}</Text>
          </View>

          {/* Questions */}
          {selectedQuestions.map((question, index) => (
            <View key={question.id} style={styles.questionContainer}>
              <Text style={styles.questionNumber}>Q{index + 1}</Text>
              
              <Text style={styles.metadata}>
                {formatMetadata(question)}
              </Text>

              {/* Image handling */}
              {question.fileUrl && isImageFile(question.fileUrl) ? (
                <View style={styles.imageContainer}>
                  <Image
                    src={question.fileUrl}
                    style={styles.questionImage}
                    cache={false}
                  />
                </View>
              ) : question.fileUrl ? (
                <View style={styles.imageContainer}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>
                      Non-image file: {question.fileUrl}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imageContainer}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>
                      No file attached
                    </Text>
                  </View>
                </View>
              )}

              {/* Teacher's Comment */}
              {question.comment && question.comment.trim() && (
                <View style={styles.commentContainer}>
                  <Text style={styles.commentLabel}>Teacher's Comment:</Text>
                  <Text style={styles.commentText}>{question.comment}</Text>
                </View>
              )}

              {/* Additional details */}
              {question.uploader && (
                <Text style={styles.metadata}>
                  Uploaded by: {question.uploader}
                </Text>
              )}

              {/* Question ID (UUID) */}
              <View style={{ marginTop: 8, paddingTop: 8, borderTop: '1 solid #e5e7eb' }}>
                <Text style={styles.questionId}>
                  <Text style={styles.questionIdLabel}>Question ID: </Text>
                  {question.id}
                </Text>
              </View>
            </View>
          ))}

          {/* Footer */}
          <Text style={styles.footer}>
            Generated by CVIT Question Paper Builder
          </Text>
        </Page>
      </Document>
    );
  }, [styles, formatMetadata, isImageFile]);

  /**
   * Generates a PDF from the selected questions using @react-pdf/renderer
   * @param {Array} selectedQuestions - Array of selected question objects in order
   * @param {Function} onSuccess - Callback function called on successful generation
   * @param {Function} onError - Callback function called on error
   * @returns {Promise<Object>} Object containing pdfBlob, fileName, and paperMetadata
   */
  const generatePDF = useCallback(async (selectedQuestions, onSuccess, onError) => {
    try {
      if (!selectedQuestions || selectedQuestions.length === 0) {
        throw new Error('No questions selected for PDF generation');
      }

      // Create the PDF document
      const pdfDocument = createPDFDocument(selectedQuestions);
      
      // Generate the PDF blob
      const pdfBlob = await pdf(pdfDocument).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `custom-paper-${timestamp}.pdf`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);

      // Extract paper metadata from questions
      const paperMetadata = {
        subject: selectedQuestions[0]?.subject || 'N/A',
        examType: selectedQuestions[0]?.examType || 'N/A',
        stream: selectedQuestions[0]?.stream || 'N/A',
        year: selectedQuestions[0]?.year || 'N/A',
        term: selectedQuestions[0]?.term || 'N/A',
        questionCount: selectedQuestions.length,
        generatedDate: new Date().toISOString(),
        questionIds: selectedQuestions.map(q => q.id)
      };

      // Call success callback
      if (onSuccess) {
        onSuccess(filename, selectedQuestions.length);
      }

      // Return PDF data for potential typeset request
      return {
        pdfBlob,
        fileName: filename,
        paperMetadata
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      if (onError) {
        onError(error.message || 'Failed to generate PDF');
      }
      throw error;
    }
  }, [createPDFDocument]);

  return {
    generatePDF
  };
};
