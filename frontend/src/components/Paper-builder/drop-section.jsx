import { useState } from "react"
import { Card, CardContent } from "@/components/UI/card"
import { Button } from "@/components/UI/Button"
import { Badge } from "@/components/UI/badge"
import { X, GripVertical, FileText } from "lucide-react"

export function DropZone({ questions, onQuestionRemove, onQuestionReorder }) {
  const [draggedOver, setDraggedOver] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setDraggedOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDraggedOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDraggedOver(false)

    try {
      const questionData = e.dataTransfer.getData("application/json")
      if (questionData) {
        const question = JSON.parse(questionData)
        // Check if question is already in the list
        if (!questions.find((q) => q.id === question.id)) {
          onQuestionReorder([...questions, question])
        }
      }
    } catch (error) {
      console.error("Error parsing dropped data:", error)
    }
  }

  const handleQuestionDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleQuestionDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      const newQuestions = [...questions]
      const draggedQuestion = newQuestions[draggedIndex]
      newQuestions.splice(draggedIndex, 1)
      newQuestions.splice(index, 0, draggedQuestion)
      onQuestionReorder(newQuestions)
      setDraggedIndex(index)
    }
  }

  const handleQuestionDragEnd = () => {
    setDraggedIndex(null)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (questions.length === 0) {
    return (
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          draggedOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2 text-foreground">Drop Questions Here</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag questions from the question bank to create your custom paper
        </p>
        <p className="text-xs text-muted-foreground">You can also click the "Add to Paper" button on any question</p>
      </div>
    )
  }

  return (
    <div
      className={`space-y-3 min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors ${
        draggedOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {questions.map((question, index) => (
        <Card
          key={question.id}
          className={`cursor-move transition-all hover:shadow-md ${draggedIndex === index ? "opacity-50" : ""}`}
          draggable
          onDragStart={(e) => handleQuestionDragStart(e, index)}
          onDragOver={(e) => handleQuestionDragOver(e, index)}
          onDragEnd={handleQuestionDragEnd}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <img
                  src={question.imageUrl || "/placeholder.svg"}
                  alt={question.title}
                  className="w-full h-20 object-cover rounded-md mb-2"
                />
                <h4 className="font-medium text-sm mb-2 line-clamp-2 text-foreground">{question.title}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {question.subject}
                  </Badge>
                  <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>{question.difficulty}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {question.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {question.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{question.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuestionRemove(question.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="text-center py-4 border-t border-dashed border-muted-foreground/25">
        <p className="text-xs text-muted-foreground">Drag questions to reorder • Drop new questions here to add them</p>
      </div>
    </div>
  )
}
