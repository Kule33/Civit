using Microsoft.AspNetCore.Mvc;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using System.Text.Json;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        [HttpPost("generate-word")]
        public IActionResult GenerateWordDocument([FromBody] DocumentRequest request)
        {
            try
            {
                if (request?.Questions == null || !request.Questions.Any())
                {
                    return BadRequest(new { message = "No questions provided" });
                }

                // Create a memory stream to write the document
                using var memoryStream = new MemoryStream();
                
                // Create a new Word document
                using (var wordDocument = WordprocessingDocument.Create(memoryStream, WordprocessingDocumentType.Document))
                {
                    // Add main document part
                    var mainPart = wordDocument.AddMainDocumentPart();
                    mainPart.Document = new Document();
                    var body = mainPart.Document.AppendChild(new Body());

                    // Add document title
                    var titleParagraph = new Paragraph();
                    var titleRun = new Run();
                    var titleRunProperties = new RunProperties();
                    titleRunProperties.AppendChild(new Bold());
                    titleRunProperties.AppendChild(new FontSize() { Val = "36" }); // 18pt font
                    titleRun.AppendChild(titleRunProperties);
                    titleRun.AppendChild(new Text(request.Title ?? "Selected Questions - Typeset Generation"));
                    titleParagraph.AppendChild(titleRun);
                    body.AppendChild(titleParagraph);

                    // Add generation info
                    var dateParagraph = new Paragraph();
                    var dateRun = new Run();
                    dateRun.AppendChild(new Text($"Generated on: {DateTime.Now:yyyy-MM-dd HH:mm:ss}"));
                    dateParagraph.AppendChild(dateRun);
                    body.AppendChild(dateParagraph);

                    var countParagraph = new Paragraph();
                    var countRun = new Run();
                    countRun.AppendChild(new Text($"Total Questions: {request.TotalQuestions}"));
                    countParagraph.AppendChild(countRun);
                    body.AppendChild(countParagraph);

                    // Add spacing
                    body.AppendChild(new Paragraph());

                    // Add each question
                    foreach (var question in request.Questions)
                    {
                        // Question header
                        var questionHeaderParagraph = new Paragraph();
                        var questionHeaderRun = new Run();
                        var questionHeaderRunProperties = new RunProperties();
                        questionHeaderRunProperties.AppendChild(new Bold());
                        questionHeaderRunProperties.AppendChild(new FontSize() { Val = "28" }); // 14pt font
                        questionHeaderRun.AppendChild(questionHeaderRunProperties);
                        questionHeaderRun.AppendChild(new Text($"Question {question.QuestionNumber}"));
                        questionHeaderParagraph.AppendChild(questionHeaderRun);
                        body.AppendChild(questionHeaderParagraph);

                        // Question metadata - simple approach
                        AddMetadataParagraph(body, $"Subject: {question.Subject ?? "N/A"}");
                        AddMetadataParagraph(body, $"School: {question.School ?? "N/A"}");
                        AddMetadataParagraph(body, $"Year: {question.Year ?? "N/A"}");
                        AddMetadataParagraph(body, $"Exam Type: {question.ExamType ?? "N/A"}");
                        AddMetadataParagraph(body, $"Paper Type: {question.PaperType ?? "N/A"}");
                        AddMetadataParagraph(body, $"Stream: {question.Stream ?? "N/A"}");

                        // Question ID
                        var questionIdParagraph = new Paragraph();
                        var questionIdRun = new Run();
                        var questionIdRunProperties = new RunProperties();
                        questionIdRunProperties.AppendChild(new Italic());
                        questionIdRunProperties.AppendChild(new FontSize() { Val = "18" }); // 9pt font
                        questionIdRun.AppendChild(questionIdRunProperties);
                        questionIdRun.AppendChild(new Text($"Question ID: {question.Id}"));
                        questionIdParagraph.AppendChild(questionIdRun);
                        body.AppendChild(questionIdParagraph);

                        // Add spacing
                        body.AppendChild(new Paragraph());

                        // Typeset content
                        if (question.HasTypeset && !string.IsNullOrEmpty(question.TypesetContent))
                        {
                            var typesetHeaderParagraph = new Paragraph();
                            var typesetHeaderRun = new Run();
                            var typesetHeaderRunProperties = new RunProperties();
                            typesetHeaderRunProperties.AppendChild(new Bold());
                            typesetHeaderRunProperties.AppendChild(new FontSize() { Val = "24" }); // 12pt font
                            typesetHeaderRun.AppendChild(typesetHeaderRunProperties);
                            typesetHeaderRun.AppendChild(new Text("Typeset Content:"));
                            typesetHeaderParagraph.AppendChild(typesetHeaderRun);
                            body.AppendChild(typesetHeaderParagraph);

                            var typesetContentParagraph = new Paragraph();
                            var typesetContentRun = new Run();
                            typesetContentRun.AppendChild(new Text(question.TypesetContent));
                            typesetContentParagraph.AppendChild(typesetContentRun);
                            body.AppendChild(typesetContentParagraph);
                        }
                        else
                        {
                            var noTypesetParagraph = new Paragraph();
                            var noTypesetRun = new Run();
                            var noTypesetRunProperties = new RunProperties();
                            noTypesetRunProperties.AppendChild(new Italic());
                            noTypesetRun.AppendChild(noTypesetRunProperties);
                            noTypesetRun.AppendChild(new Text("No typeset content available for this question."));
                            noTypesetParagraph.AppendChild(noTypesetRun);
                            body.AppendChild(noTypesetParagraph);
                        }

                        // Add separator between questions
                        body.AppendChild(new Paragraph());
                        var separatorParagraph = new Paragraph();
                        var separatorRun = new Run();
                        separatorRun.AppendChild(new Text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                        separatorParagraph.AppendChild(separatorRun);
                        body.AppendChild(separatorParagraph);
                        body.AppendChild(new Paragraph());

                        // Add page break after each question except the last one
                        if (question.QuestionNumber < request.TotalQuestions)
                        {
                            var pageBreakParagraph = new Paragraph();
                            var pageBreakRun = new Run();
                            pageBreakRun.AppendChild(new Break() { Type = BreakValues.Page });
                            pageBreakParagraph.AppendChild(pageBreakRun);
                            body.AppendChild(pageBreakParagraph);
                        }
                    }

                    // Save the document
                    mainPart.Document.Save();
                }

                // Return the document as a file
                var fileName = $"selected-questions-{DateTime.Now:yyyyMMdd-HHmmss}.docx";
                return File(memoryStream.ToArray(), 
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                    fileName);

            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating Word document: {ex.Message}");
                return StatusCode(500, new { message = "Failed to generate Word document", error = ex.Message });
            }
        }

        private void AddMetadataParagraph(Body body, string text)
        {
            var paragraph = new Paragraph();
            var run = new Run();
            var runProperties = new RunProperties();
            runProperties.AppendChild(new FontSize() { Val = "20" }); // 10pt font
            run.AppendChild(runProperties);
            run.AppendChild(new Text(text));
            paragraph.AppendChild(run);
            body.AppendChild(paragraph);
        }
    }

    // Request models
    public class DocumentRequest
    {
        public string? Title { get; set; }
        public string? GeneratedDate { get; set; }
        public int TotalQuestions { get; set; }
        public List<QuestionForDocument> Questions { get; set; } = new();
    }

    public class QuestionForDocument
    {
        public int QuestionNumber { get; set; }
        public string Id { get; set; } = string.Empty;
        public string? Subject { get; set; }
        public string? School { get; set; }
        public string? Year { get; set; }
        public string? ExamType { get; set; }
        public string? PaperType { get; set; }
        public string? Stream { get; set; }
        public string? TypesetContent { get; set; }
        public bool HasTypeset { get; set; }
    }
}