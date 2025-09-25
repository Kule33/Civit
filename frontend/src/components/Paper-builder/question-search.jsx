import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/UI/card"
import { Badge } from "@/components/UI/badge"
import { Button } from "@/components/UI/Button"
import { Plus, GripVertical } from "lucide-react"

// Mock data for demonstration
const mockQuestions = [
  {
    id: "1",
    title: "Solve for x: 2x + 5 = 15",
    subject: "Mathematics",
    difficulty: "easy",
    imageUrl: "/math-equation-2x-plus-5-equals-15.jpg",
    tags: ["algebra", "linear equations"],
  },
  {
    id: "2",
    title: "Explain the process of photosynthesis",
    subject: "Biology",
    difficulty: "medium",
    imageUrl: "/photosynthesis-diagram-with-chloroplast.jpg",
    tags: ["photosynthesis", "plants", "biology"],
  },
  {
    id: "3",
    title: "Calculate the derivative of f(x) = x³ + 2x² - 5x + 1",
    subject: "Mathematics",
    difficulty: "hard",
    imageUrl: "/calculus-derivative-equation.jpg",
    tags: ["calculus", "derivatives", "polynomials"],
  },
  {
    id: "4",
    title: "Describe the causes of World War I",
    subject: "History",
    difficulty: "medium",
    imageUrl: "/world-war-1-historical-timeline.jpg",
    tags: ["history", "world war", "causes"],
  },
  {
    id: "5",
    title: "Balance the chemical equation: H₂ + O₂ → H₂O",
    subject: "Chemistry",
    difficulty: "easy",
    imageUrl: "/chemical-equation-balancing-water-formation.jpg",
    tags: ["chemistry", "balancing equations", "water"],
  },
  {
    id: "6",
    title: "Analyze the themes in Shakespeare's Hamlet",
    subject: "Literature",
    difficulty: "hard",
    imageUrl: "/shakespeare-hamlet-book-cover-literary-analysis.jpg",
    tags: ["literature", "shakespeare", "analysis"],
  },
]

export function QuestionSearch({ searchQuery, onQuestionSelect, selectedQuestions }) {
  const [filteredQuestions, setFilteredQuestions] = useState(mockQuestions)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQuestions(mockQuestions)
      return
    }

    const filtered = mockQuestions.filter(
      (question) =>
        question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    setFilteredQuestions(filtered)
  }, [searchQuery])

  const isSelected = (questionId) => {
    return selectedQuestions.some((q) => q.id === questionId)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200"
      case "medium":
        return "bg-blue-200 text-blue-800 hover:bg-blue-300"
      case "hard":
        return "bg-blue-300 text-blue-900 hover:bg-blue-400"
      default:
        return "bg-blue-100 text-blue-700 hover:bg-blue-200"
    }
  }

  return (
    <div className="space-y-3">
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No questions found matching your search criteria.</div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question) => (
            <Card
              key={question.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected(question.id) ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify(question))
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  
                  {/* Question Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={question.imageUrl || "/placeholder.svg"}
                      alt={question.title}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                  
                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2 text-foreground">{question.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {question.subject}
                      </Badge>
                      <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {question.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => onQuestionSelect(question)}
                      disabled={isSelected(question.id)}
                      className="w-32"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {isSelected(question.id) ? "Added" : "Add to Paper"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
