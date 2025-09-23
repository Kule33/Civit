import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight, FileText, GripVertical } from 'lucide-react';
import Button from './ui/Button.jsx';
import Card from './ui/card.jsx';
import QuestionCard from './QuestionCard.jsx';

/**
 * SelectedQuestionsSidebar component for displaying and managing selected questions
 * Features drag-and-drop reordering, individual question removal, and PDF generation
 * 
 * @param {Object} props - Component props
 * @param {Array} props.selectedQuestionsOrdered - Array of selected question objects in order
 * @param {Function} props.setSelectedQuestionsOrdered - Function to update the ordered questions
 * @param {Function} props.onDownloadPaper - Callback function for PDF generation
 * @param {boolean} props.isCollapsed - Whether the sidebar is collapsed (mobile)
 * @param {Function} props.onToggleCollapse - Function to toggle sidebar collapse state
 */
const SelectedQuestionsSidebar = ({
  selectedQuestionsOrdered,
  setSelectedQuestionsOrdered,
  onDownloadPaper,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // State for drag-and-drop functionality
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // State for PDF generation loading
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  /**
   * Handles removing a question from the selected list
   * @param {string|number} questionId - ID of the question to remove
   */
  const handleRemoveQuestion = (questionId) => {
    const updatedQuestions = selectedQuestionsOrdered.filter(q => q.id !== questionId);
    setSelectedQuestionsOrdered(updatedQuestions);
  };

  /**
   * Handles PDF generation with loading state
   */
  const handleDownloadClick = async () => {
    if (selectedQuestionsOrdered.length === 0) return;
    
    setIsGeneratingPDF(true);
    try {
      await onDownloadPaper(selectedQuestionsOrdered);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  /**
   * Handles drag start with question index
   * @param {Event} event - Drag event
   * @param {number} index - Index of the question being dragged
   */
  const handleQuestionDragStart = (event, index) => {
    setDraggedItem(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', index);
  };

  /**
   * Handles drag over with question index
   * @param {Event} event - Drag event
   * @param {number} index - Index of the question being dragged over
   */
  const handleQuestionDragOver = (event, index) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  /**
   * Handles drag leave
   * @param {Event} event - Drag event
   */
  const handleQuestionDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  /**
   * Handles drop with question index
   * @param {Event} event - Drop event
   * @param {number} dropIndex - Index where the question is being dropped
   */
  const handleQuestionDrop = (event, dropIndex) => {
    event.preventDefault();
    
    const draggedIndex = parseInt(event.dataTransfer.getData('text/html')) || draggedItem;
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      // Reorder the questions
      const newOrderedQuestions = [...selectedQuestionsOrdered];
      const [movedQuestion] = newOrderedQuestions.splice(draggedIndex, 1);
      newOrderedQuestions.splice(dropIndex, 0, movedQuestion);
      
      // Update parent state
      setSelectedQuestionsOrdered(newOrderedQuestions);
    }
    
    // Reset drag states
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  /**
   * Handles drag end
   * @param {Event} event - Drag event
   */
  const handleQuestionDragEnd = (event) => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <div className={`bg-white border-l border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-0 overflow-hidden' : 'w-80'
    }`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Selected Questions</h3>
          </div>
          
          {/* Mobile collapse button */}
          <Button
            variant="ghost"
            size="small"
            onClick={onToggleCollapse}
            className="lg:hidden p-1"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Question count and download button */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {selectedQuestionsOrdered.length} question{selectedQuestionsOrdered.length !== 1 ? 's' : ''} selected
          </span>
          
          <Button
            variant="primary"
            size="small"
            onClick={handleDownloadClick}
            disabled={selectedQuestionsOrdered.length === 0 || isGeneratingPDF}
            icon={Download}
          >
            {isGeneratingPDF ? 'Generating...' : 'Download Paper'}
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto">
        {selectedQuestionsOrdered.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No questions selected</p>
            <p className="text-xs text-gray-400 mt-1">
              Select questions from the search results to build your paper
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {selectedQuestionsOrdered.map((question, index) => (
              <div
                key={question.id}
                className="relative"
                draggable
                onDragStart={(e) => handleQuestionDragStart(e, index)}
                onDragOver={(e) => handleQuestionDragOver(e, index)}
                onDragLeave={handleQuestionDragLeave}
                onDrop={(e) => handleQuestionDrop(e, index)}
                onDragEnd={handleQuestionDragEnd}
              >
                <QuestionCard
                  question={question}
                  variant="sidebar"
                  isDraggable={true}
                  showRemoveButton={true}
                  isDragOver={dragOverIndex === index}
                  isBeingDragged={draggedItem === index}
                  onSelect={handleRemoveQuestion}
                  onDragStart={(e) => handleQuestionDragStart(e, index)}
                  onDragOver={(e) => handleQuestionDragOver(e, index)}
                  onDragLeave={handleQuestionDragLeave}
                  onDrop={(e) => handleQuestionDrop(e, index)}
                  onDragEnd={handleQuestionDragEnd}
                />
                
                {/* Question number indicator */}
                <div className="absolute -left-2 -top-2 bg-blue-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      {selectedQuestionsOrdered.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            <p>Drag questions to reorder</p>
            <p className="mt-1">Click × to remove</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectedQuestionsSidebar;
