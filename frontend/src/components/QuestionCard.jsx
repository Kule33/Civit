import React from 'react';
import { X, GripVertical } from 'lucide-react';
import Button from './ui/Button.jsx';

/**
 * Reusable QuestionCard component for displaying question thumbnails and metadata
 * Used in both the main results grid and the selected questions sidebar
 * 
 * @param {Object} props - Component props
 * @param {Object} props.question - Question object containing all question data
 * @param {boolean} props.isSelected - Whether the question is currently selected
 * @param {Function} props.onSelect - Callback function when question is selected/deselected
 * @param {boolean} props.showRemoveButton - Whether to show the remove button (for sidebar)
 * @param {boolean} props.isDraggable - Whether the card can be dragged (for sidebar)
 * @param {Function} props.onDragStart - Drag start handler (for sidebar)
 * @param {Function} props.onDragOver - Drag over handler (for sidebar)
 * @param {Function} props.onDragLeave - Drag leave handler (for sidebar)
 * @param {Function} props.onDrop - Drop handler (for sidebar)
 * @param {Function} props.onDragEnd - Drag end handler (for sidebar)
 * @param {boolean} props.isDragOver - Whether this card is currently being dragged over
 * @param {boolean} props.isBeingDragged - Whether this card is currently being dragged
 * @param {string} props.variant - Display variant ('grid' or 'sidebar')
 */
const QuestionCard = ({
  question,
  isSelected = false,
  onSelect,
  showRemoveButton = false,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragOver = false,
  isBeingDragged = false,
  variant = 'grid'
}) => {
  // Check if the question has an image file
  const isImage = typeof question.fileUrl === 'string' && 
    /(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/i.test(question.fileUrl);

  // Determine the card styling based on variant and state
  const getCardClasses = () => {
    const baseClasses = "border rounded-lg overflow-hidden transition-all duration-200";
    
    if (variant === 'sidebar') {
      return `${baseClasses} ${
        isDragOver 
          ? 'border-blue-400 bg-blue-50 shadow-lg' 
          : isBeingDragged
          ? 'opacity-50 shadow-lg'
          : 'border-gray-200 bg-white hover:shadow-md'
      }`;
    }
    
    // Grid variant
    return `${baseClasses} ${
      isSelected
        ? 'border-blue-500 bg-blue-50 shadow-md'
        : 'border-gray-200 bg-white hover:shadow-md'
    }`;
  };

  // Get the appropriate height for the image preview based on variant
  const getImageHeight = () => {
    return variant === 'sidebar' ? 'h-24' : 'h-20';
  };

  // Get the appropriate padding for the content based on variant
  const getContentPadding = () => {
    return variant === 'sidebar' ? 'p-2' : 'p-3';
  };

  // Get the appropriate text size for metadata based on variant
  const getMetadataTextSize = () => {
    return variant === 'sidebar' ? 'text-[10px]' : 'text-[11px]';
  };

  // Get the appropriate text size for details based on variant
  const getDetailsTextSize = () => {
    return variant === 'sidebar' ? 'text-[9px]' : 'text-xs';
  };

  return (
    <div
      className={getCardClasses()}
      draggable={isDraggable}
      onDragStart={isDraggable ? (e) => onDragStart?.(e) : undefined}
      onDragOver={isDraggable ? (e) => onDragOver?.(e) : undefined}
      onDragLeave={isDraggable ? (e) => onDragLeave?.(e) : undefined}
      onDrop={isDraggable ? (e) => onDrop?.(e) : undefined}
      onDragEnd={isDraggable ? (e) => onDragEnd?.(e) : undefined}
    >
      {/* Drag handle for sidebar variant */}
      {variant === 'sidebar' && isDraggable && (
        <div className="flex items-center justify-center bg-gray-50 p-1 cursor-move">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Image preview section */}
      {variant === 'grid' ? (
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          {/* Question Image */}
          <div className="flex-shrink-0 w-full sm:w-20">
            {isImage ? (
              <img 
                src={question.fileUrl} 
                alt={question.subject?.name || 'Question'} 
                className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-md" 
              />
            ) : (
              <div className="w-full sm:w-20 h-32 sm:h-20 bg-gray-50 flex items-center justify-center text-gray-400 text-xs rounded-md">
                No Image
              </div>
            )}
          </div>
          
          {/* Question Content */}
          <div className="flex-1 min-w-0 w-full">
            <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-2 line-clamp-2">
              {question.subject?.name || 'Unknown Subject'}
            </h3>
            
            {/* Metadata tags */}
            <div className={`flex flex-wrap gap-1.5 text-gray-600 mb-2 text-[10px] sm:${getMetadataTextSize()}`}>
              {question.country && (
                <span className="bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                  {question.country}
                </span>
              )}
              {question.examType && (
                <span className="bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                  {question.examType}
                </span>
              )}
              {question.paperCategory && (
                <span className="bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                  {question.paperCategory}
                </span>
              )}
              {question.paperType && (
                <span className="bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                  {question.paperType}
                </span>
              )}
              {question.year && (
                <span className="bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                  {question.year}
                </span>
              )}
              {question.term && (
                <span className="bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                  {question.term}
                </span>
              )}
            </div>

            {/* Additional details */}
            <div className={`text-gray-700 space-y-1 text-xs sm:${getDetailsTextSize()}`}>
              {question.school?.name && (
                <p className="truncate">School: {question.school.name}</p>
              )}
              {question.uploader && (
                <p className="truncate">By: {question.uploader}</p>
              )}
            </div>

            {/* File link */}
            {question.fileUrl && (
              <a 
                href={question.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-xs"
              >
                View File ↗
              </a>
            )}
          </div>
          
          {/* Action Button */}
          <div className="flex-shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
            <Button
              variant={isSelected ? "secondary" : "outline"}
              size="small"
              onClick={() => onSelect?.(question.id)}
              className="w-full sm:w-32"
            >
              {isSelected ? 'Selected' : 'Select'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {isImage ? (
            <div className={`${getImageHeight()} bg-gray-50 overflow-hidden`}>
              <img 
                src={question.fileUrl} 
                alt={question.subject?.name || 'Question'} 
                className="w-full h-full object-cover" 
              />
            </div>
          ) : (
            <div className={`${getImageHeight()} bg-gray-50 flex items-center justify-center text-gray-400 text-sm`}>
              No Image
            </div>
          )}
        </>
      )}

      {/* Content section for sidebar variant */}
      {variant === 'sidebar' && (
        <div className={getContentPadding()}>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              {/* Subject name */}
              <h3 className="text-xs font-semibold text-gray-900 mb-2">
                {question.subject?.name || 'Unknown Subject'}
              </h3>

              {/* Metadata tags */}
              <div className={`flex flex-wrap gap-1 text-gray-600 mb-2 ${getMetadataTextSize()}`}>
                {question.country && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {question.country}
                  </span>
                )}
                {question.examType && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {question.examType}
                  </span>
                )}
                {question.paperCategory && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {question.paperCategory}
                  </span>
                )}
                {question.paperType && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {question.paperType}
                  </span>
                )}
                {question.year && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {question.year}
                  </span>
                )}
                {question.term && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {question.term}
                  </span>
                )}
              </div>

              {/* Additional details */}
              <div className={`text-gray-700 space-y-1 ${getDetailsTextSize()}`}>
                {question.school?.name && (
                  <p>School: {question.school.name}</p>
                )}
                {question.uploader && (
                  <p>By: {question.uploader}</p>
                )}
              </div>
            </div>

            {/* Remove button for sidebar */}
            {showRemoveButton && (
              <Button
                variant="outline"
                size="small"
                onClick={() => onSelect?.(question.id)}
                className="p-1 h-6 w-6"
                title="Remove question"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
