import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx"
import { PDFDocument, StandardFonts } from "pdf-lib"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { richTextToPlainText } from "@/lib/rich-text"
import { getProjectChapters } from "@/features/chapters/repositories/chapter-repository"
import { getStudentProjectDetails } from "@/features/projects/repositories/project-repository"

function filename(value: string) { return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "research-project" }
export async function GET(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers }); if (!session || session.user.role !== "STUDENT") return new NextResponse("Unauthorized", { status: 401 })
  const { projectId } = await context.params; const [project, chapters] = await Promise.all([getStudentProjectDetails(session.user.id, projectId), getProjectChapters(session.user.id, projectId)]); if (!project || !chapters) return new NextResponse("Not found", { status: 404 })
  const format = request.nextUrl.searchParams.get("format"); const base = filename(project.title)
  if (format === "docx") { const doc = new Document({ sections: [{ children: [new Paragraph({ text: project.title, heading: HeadingLevel.TITLE }), new Paragraph({ children: [new TextRun({ text: project.owner.name, italics: true })] }), ...chapters.flatMap((chapter) => [new Paragraph({ text: chapter.title, heading: HeadingLevel.HEADING_1 }), ...richTextToPlainText(chapter.content).split(/\n+/).filter(Boolean).map((text) => new Paragraph(text))]) ] }] }); const buffer = await Packer.toBuffer(doc); return new NextResponse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${base}.docx"` } }) }
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.TimesRoman); const bold = await pdf.embedFont(StandardFonts.TimesRomanBold); let page = pdf.addPage([595, 842]); let y = 790
  const line = (text: string, size = 11, heading = false) => { for (const raw of text.match(new RegExp(`.{1,${heading ? 55 : 90}}(?:\\s|$)`, "g")) ?? [text]) { if (y < 55) { page = pdf.addPage([595, 842]); y = 790 } page.drawText(raw.trim(), { x: 50, y, size, font: heading ? bold : font }); y -= size + 6 } }
  line(project.title, 20, true); y -= 10; for (const chapter of chapters) { line(chapter.title, 16, true); y -= 4; richTextToPlainText(chapter.content).split(/\n+/).filter(Boolean).forEach((paragraph) => { line(paragraph); y -= 5 }); y -= 8 }
  const pdfBytes = await pdf.save(); return new NextResponse(pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${base}.pdf"` } })
}
