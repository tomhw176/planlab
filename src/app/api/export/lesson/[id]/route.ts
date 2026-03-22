import { prisma } from "@/lib/db";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        unit: { include: { course: true } },
        resources: true,
        tags: true,
      },
    });

    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    const activities = Array.isArray(lesson.activities)
      ? (lesson.activities as { name: string; duration: string; description: string }[])
      : [];

    const children: (Paragraph | Table)[] = [];

    // Title
    children.push(
      new Paragraph({
        text: lesson.title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      })
    );

    // Course / Unit context
    if (lesson.unit) {
      const context = [lesson.unit.course?.title, lesson.unit.title]
        .filter(Boolean)
        .join(" > ");
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: context, italics: true, color: "666666" }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Status
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Status: ", bold: true }),
          new TextRun({ text: lesson.status === "confirmed" ? "Confirmed" : "Draft" }),
        ],
        spacing: { after: 300 },
      })
    );

    // Sections
    const sections: [string, string][] = [
      ["Hook / Opener", lesson.hook],
      ["Learning Objectives", lesson.learningObjectives],
      ["Connection to Curriculum", typeof lesson.curriculumConnection === 'object' ? JSON.stringify(lesson.curriculumConnection) : String(lesson.curriculumConnection || "")],
      ["Key Vocabulary", lesson.keyVocabulary],
      ["Transferable Concepts", lesson.transferableConcepts],
      ["Materials Needed", lesson.materialsNeeded],
      ["Differentiation Notes", lesson.differentiation],
      ["Assessment / Check for Understanding", lesson.assessment],
      ["Closure", lesson.closure],
    ];

    for (const [heading, content] of sections) {
      if (!content) continue;
      children.push(
        new Paragraph({
          text: heading,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      children.push(
        new Paragraph({
          text: content,
          spacing: { after: 200 },
        })
      );
    }

    // Activities table
    if (activities.length > 0) {
      children.push(
        new Paragraph({
          text: "Activities",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const headerRow = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Activity", bold: true })] })],
            width: { size: 40, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true })] })],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })],
            width: { size: 45, type: WidthType.PERCENTAGE },
          }),
        ],
      });

      const activityRows = activities.map(
        (act) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: act.name || "" })] }),
              new TableCell({ children: [new Paragraph({ text: act.duration || "" })] }),
              new TableCell({ children: [new Paragraph({ text: act.description || "" })] }),
            ],
          })
      );

      children.push(
        new Table({
          rows: [headerRow, ...activityRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);

    const filename = `${lesson.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.docx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}
