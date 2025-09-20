# Paper Builder Enhancements

This document describes the enhancements made to the Paper Builder component to add sidebar functionality, drag-and-drop reordering, and PDF generation capabilities.

## New Components

### 1. `useDragOrder` Hook (`hooks/useDragOrder.js`)
Custom hook for handling drag-and-drop reordering functionality.

**Features:**
- Manages ordered items state
- Provides drag event handlers
- Handles reordering logic
- Cross-browser compatible

**Usage:**
```javascript
const {
  orderedItems,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd
} = useDragOrder(initialItems);
```

### 2. `usePaperGeneration` Hook (`hooks/usePaperGeneration.js`)
Custom hook for generating PDF papers from selected questions.

**Features:**
- Image loading and processing
- PDF formatting with proper pagination
- Metadata inclusion
- Error handling
- Automatic filename generation with timestamps

**Usage:**
```javascript
const { generatePDF } = usePaperGeneration();

await generatePDF(questions, onSuccess, onError);
```

### 3. `QuestionCard` Component (`components/QuestionCard.jsx`)
Reusable component for displaying question thumbnails and metadata.

**Features:**
- Supports both grid and sidebar variants
- Image preview handling
- Metadata display
- Drag-and-drop support
- Responsive design

**Props:**
- `question`: Question object
- `isSelected`: Selection state
- `onSelect`: Selection callback
- `variant`: Display variant ('grid' or 'sidebar')
- `isDraggable`: Enable drag functionality
- `showRemoveButton`: Show remove button (sidebar)

### 4. `SelectedQuestionsSidebar` Component (`components/SelectedQuestionsSidebar.jsx`)
Sidebar component for managing selected questions.

**Features:**
- Drag-and-drop reordering
- Individual question removal
- Question count display
- PDF generation trigger
- Mobile-responsive design
- Collapsible on mobile

**Props:**
- `selectedQuestionsOrdered`: Array of ordered questions
- `setSelectedQuestionsOrdered`: State setter
- `onDownloadPaper`: PDF generation callback
- `isCollapsed`: Collapse state
- `onToggleCollapse`: Toggle callback

## Enhanced Features

### 1. Sidebar Display
- Shows selected questions with thumbnails
- Displays key metadata (subject, year, exam type, school)
- Question numbering (Q1, Q2, etc.)
- Total count display

### 2. Drag-and-Drop Reordering
- Intuitive drag-and-drop interface
- Visual feedback during dragging
- Maintains question order for PDF generation
- Cross-browser compatibility

### 3. PDF Generation
- Well-formatted PDF output
- Automatic question numbering
- Image inclusion with proper scaling
- Metadata headers
- Page numbering
- Timestamped filenames
- Error handling for failed image loads

### 4. Responsive Design
- Desktop: Fixed sidebar alongside main content
- Mobile: Collapsible sidebar with overlay
- Adaptive layouts for different screen sizes

### 5. Performance Optimizations
- Memoized question cards to prevent unnecessary re-renders
- Efficient state management
- Single source of truth for selected questions

## Usage

### Basic Usage
1. Search for questions using the filter system
2. Select questions by clicking the "Select" button
3. View selected questions in the sidebar
4. Reorder questions by dragging them in the sidebar
5. Click "Download Paper" to generate PDF

### Mobile Usage
1. Use the "Show Sidebar" button to toggle the sidebar
2. The sidebar appears as an overlay on mobile
3. Tap outside the sidebar to close it

## Technical Details

### State Management
- `selectedQuestions`: Array of question IDs (for quick lookups)
- `selectedQuestionsOrdered`: Array of question objects in order (for PDF generation)
- Both arrays are kept in sync automatically

### PDF Generation Process
1. Load images asynchronously
2. Calculate proper image dimensions
3. Generate PDF with jsPDF
4. Add metadata and formatting
5. Include page numbers
6. Trigger download

### Error Handling
- Graceful image loading failures
- PDF generation error handling
- User feedback via overlay notifications

## Dependencies
- `jspdf`: For PDF generation
- `lucide-react`: For icons
- React hooks for state management

## Browser Support
- Modern browsers with drag-and-drop API support
- CORS-enabled image loading
- PDF download functionality
