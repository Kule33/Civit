import { useState } from "react"
import { Button } from "@/components/UI/Button"
import { Input } from "@/components/UI/input"
import { FileDown, Loader2, Settings } from "lucide-react"

export function PDFGenerator({ questions, disabled = false }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    title: "Custom Question Paper",
    includeAnswerSpace: true,
    includeMetadata: true,
    pageOrientation: "portrait",
    fontSize: 12,
    includeImages: true,
  })

  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        try {
          const dataURL = canvas.toDataURL("image/jpeg", 0.8)
          resolve(dataURL)
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = url
    })
  }

  const generatePDF = async () => {
    if (questions.length === 0) return

    setIsGenerating(true)

    try {
      // Import jsPDF dynamically to avoid SSR issues
      const { jsPDF } = await import("jspdf")

      const pdf = new jsPDF({
        orientation: settings.pageOrientation,
        unit: "mm",
        format: "a4",
      })

      // PDF configuration
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - 2 * margin
      let currentY = margin

      // Add title
      pdf.setFontSize(Math.max(settings.fontSize + 8, 16))
      pdf.setFont("helvetica", "bold")
      const titleWidth = pdf.getTextWidth(settings.title)
      pdf.text(settings.title, (pageWidth - titleWidth) / 2, currentY)
      currentY += 15

      // Add metadata if enabled
      if (settings.includeMetadata) {
        pdf.setFontSize(Math.max(settings.fontSize - 2, 8))
        pdf.setFont("helvetica", "normal")
        pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, currentY)
        pdf.text(`Total Questions: ${questions.length}`, pageWidth - margin - 40, currentY)
        currentY += 10

        // Add line separator
        pdf.setDrawColor(150, 150, 150)
        pdf.line(margin, currentY, pageWidth - margin, currentY)
        currentY += 15
      }

      // Process each question
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]

        // Check if we need a new page (reserve space for question content)
        const estimatedQuestionHeight = settings.includeImages ? 80 : 40
        if (currentY > pageHeight - estimatedQuestionHeight - margin) {
          pdf.addPage()
          currentY = margin
        }

        // Question number and title
        pdf.setFontSize(settings.fontSize)
        pdf.setFont("helvetica", "bold")
        pdf.text(`Q${i + 1}.`, margin, currentY)

        // Split long titles into multiple lines
        const titleLines = pdf.splitTextToSize(question.title, contentWidth - 15)
        pdf.setFont("helvetica", "normal")
        pdf.text(titleLines, margin + 12, currentY)
        currentY += titleLines.length * 5 + 8

        // Subject and difficulty info
        if (settings.includeMetadata) {
          pdf.setFontSize(Math.max(settings.fontSize - 2, 8))
          pdf.setTextColor(100, 100, 100)
          pdf.text(
            `Subject: ${question.subject} | Difficulty: ${question.difficulty.toUpperCase()}`,
            margin + 12,
            currentY,
          )
          currentY += 6

          // Tags
          if (question.tags.length > 0) {
            pdf.text(`Tags: ${question.tags.join(", ")}`, margin + 12, currentY)
            currentY += 8
          }
          pdf.setTextColor(0, 0, 0) // Reset color
        }

        // Add image if enabled and available
        if (settings.includeImages && question.imageUrl) {
          try {
            // For demo purposes, we'll add a placeholder rectangle
            // In a real implementation, you would load and embed the actual image
            pdf.setDrawColor(200, 200, 200)
            pdf.setFillColor(250, 250, 250)
            pdf.rect(margin + 12, currentY, Math.min(contentWidth - 24, 80), 40, "FD")

            pdf.setFontSize(Math.max(settings.fontSize - 3, 7))
            pdf.setTextColor(120, 120, 120)
            pdf.text("Question Image", margin + 16, currentY + 22)
            pdf.setTextColor(0, 0, 0)

            currentY += 45
          } catch (error) {
            console.warn("Failed to load image for question", question.id, error)
          }
        }

        // Add comment if available
        if (question.comment && question.comment.trim()) {
          currentY += 5
          pdf.setFontSize(Math.max(settings.fontSize - 1, 9))
          pdf.setFont("helvetica", "bold")
          pdf.setTextColor(0, 100, 200) // Blue color for comments
          pdf.text("Teacher's Comment:", margin + 12, currentY)
          currentY += 6
          
          // Split comment into multiple lines if too long
          const commentLines = pdf.splitTextToSize(question.comment, contentWidth - 24)
          pdf.setFont("helvetica", "normal")
          pdf.setTextColor(0, 0, 0) // Reset to black
          pdf.text(commentLines, margin + 12, currentY)
          currentY += commentLines.length * 4 + 8
        }

        // Add answer space if enabled
        if (settings.includeAnswerSpace) {
          currentY += 5
          pdf.setFontSize(Math.max(settings.fontSize - 1, 9))
          pdf.setFont("helvetica", "italic")
          pdf.text("Answer:", margin + 12, currentY)
          currentY += 8

          // Draw lines for answer space
          pdf.setDrawColor(200, 200, 200)
          for (let line = 0; line < 3; line++) {
            pdf.line(margin + 12, currentY + line * 6, pageWidth - margin - 12, currentY + line * 6)
          }
          currentY += 20
        }

        // Add space between questions
        currentY += 10
      }

      // Add footer on last page
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "italic")
      pdf.setTextColor(100, 100, 100)
      pdf.text("Generated by Paper Creator", margin, pageHeight - 10)
      pdf.text(`Page ${pdf.getNumberOfPages()}`, pageWidth - margin - 20, pageHeight - 10)

      // Save the PDF
      const fileName = `${settings.title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsGenerating(false)
      setShowSettings(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>PDF Settings</DialogTitle>
            <DialogDescription>Customize your question paper before generating the PDF.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Paper Title</Label>
              <Input
                id="title"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                placeholder="Enter paper title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={settings.pageOrientation}
                  onValueChange={(value) => setSettings({ ...settings, pageOrientation: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Select
                  value={settings.fontSize.toString()}
                  onValueChange={(value) => setSettings({ ...settings, fontSize: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10pt</SelectItem>
                    <SelectItem value="12">12pt</SelectItem>
                    <SelectItem value="14">14pt</SelectItem>
                    <SelectItem value="16">16pt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeImages"
                  checked={settings.includeImages}
                  onCheckedChange={(checked) => setSettings({ ...settings, includeImages: !!checked })}
                />
                <Label htmlFor="includeImages">Include question images</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAnswerSpace"
                  checked={settings.includeAnswerSpace}
                  onCheckedChange={(checked) => setSettings({ ...settings, includeAnswerSpace: !!checked })}
                />
                <Label htmlFor="includeAnswerSpace">Include answer spaces</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetadata"
                  checked={settings.includeMetadata}
                  onCheckedChange={(checked) => setSettings({ ...settings, includeMetadata: !!checked })}
                />
                <Label htmlFor="includeMetadata">Include question metadata</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={generatePDF} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button onClick={generatePDF} disabled={disabled || isGenerating} className="flex items-center gap-2">
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        {isGenerating ? "Generating..." : "Generate PDF"}
      </Button>
    </div>
  )
}
