import React, { useState } from "react"
import { Search, FileText } from "lucide-react"

/**
 * Paper Creation Page Component
 * Allows teachers to search for questions and create custom test papers
 */
export default function PaperCreationPage() {
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <h1 className="text-2xl font-semibold text-gray-900">Paper Creator</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search 
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" 
              aria-hidden="true" 
            />
            <input
              type="text"
              placeholder="Search questions by topic, subject, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search questions"
            />
          </div>
          
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={selectedQuestions.length === 0}
          >
            Generate PDF
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Results */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Question Bank
            </h2>
            <div className="text-gray-500 text-center py-8">
              Question search component will be loaded here...
              <br />
              <small>Search query: "{searchQuery}"</small>
            </div>
          </div>
        </div>

        {/* Selected Questions Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Selected Questions ({selectedQuestions.length})
            </h2>
            <div className="text-gray-500 text-center py-8">
              Drop zone will be loaded here...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
