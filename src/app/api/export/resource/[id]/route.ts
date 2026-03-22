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
  AlignmentType,
  PageBreak,
  ShadingType,
} from "docx";
import PptxGenJS from "pptxgenjs";

// ── DOCX Builders ──

function buildBriefingDocx(
  content: Record<string, unknown>,
  lessonTitle: string
): Document {
  const children: (Paragraph | Table)[] = [];
  const format = (content.format as string) || "memo";
  const from = (content.from as string) || "";
  const to = (content.to as string) || "";
  const date = (content.date as string) || "";
  const subject = (content.subject as string) || "";
  const body = (content.body as string[]) || [];
  const closingTask = (content.closingTask as string) || "";

  // Header block
  const headerLabel = format === "letter" ? "LETTER" : format === "brief" ? "ADVISORY BRIEF" : "CONFIDENTIAL MEMO";
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: headerLabel,
          bold: true,
          size: 28,
          font: "Georgia",
          color: "333333",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "333333" },
      },
    })
  );

  // Meta fields
  const metaFields: [string, string][] = [
    ["FROM:", from],
    ["TO:", to],
    ["DATE:", date],
    ["RE:", subject],
  ];

  for (const [label, value] of metaFields) {
    if (!value) continue;
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: label + " ", bold: true, size: 22, font: "Georgia" }),
          new TextRun({ text: value, size: 22, font: "Georgia" }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  // Divider
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
      },
    })
  );

  // Body paragraphs
  for (const paragraph of body) {
    children.push(
      new Paragraph({
        text: paragraph,
        spacing: { after: 200 },
        style: "Normal",
      })
    );
  }

  // Closing task (highlighted)
  if (closingTask) {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 2, color: "333333" },
        },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "YOUR TASK: ", bold: true, size: 24, font: "Georgia" }),
          new TextRun({ text: closingTask, size: 22, font: "Georgia", italics: true }),
        ],
        spacing: { after: 200 },
        shading: { type: ShadingType.CLEAR, fill: "F5F5DC" },
      })
    );
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { size: 22, font: "Georgia" },
        },
      },
    },
    sections: [{ children }],
  });
}

function buildRoleCardsDocx(
  content: Record<string, unknown>,
  lessonTitle: string
): Document {
  const roles = (content.roles as Array<{
    title: string;
    who: string;
    whatTheyWant: string;
    whatTheyFear: string;
    biasOrPriority: string;
  }>) || [];

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      text: "Role Cards",
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: lessonTitle, italics: true, color: "666666" })],
      spacing: { after: 300 },
    })
  );

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];

    // Role card as a bordered table
    const cardRows: TableRow[] = [];

    // Title row (shaded header)
    cardRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: role.title, bold: true, size: 28, color: "FFFFFF" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: "4338CA" },
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      })
    );

    // Content fields
    const fields: [string, string][] = [
      ["WHO YOU ARE", role.who],
      ["WHAT YOU WANT", role.whatTheyWant],
      ["WHAT YOU FEAR", role.whatTheyFear],
      ["YOUR BIAS / PRIORITY", role.biasOrPriority],
    ];

    for (const [label, value] of fields) {
      cardRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: label, bold: true, size: 20, color: "4338CA" }),
                  ],
                  spacing: { after: 60 },
                }),
                new Paragraph({
                  text: value || "",
                  spacing: { after: 100 },
                }),
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
    }

    children.push(
      new Table({
        rows: cardRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    // Page break between cards (except after last)
    if (i < roles.length - 1) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  }

  return new Document({ sections: [{ children }] });
}

function buildWorksheetDocx(
  content: Record<string, unknown>,
  lessonTitle: string
): Document {
  const sections = (content.sections as Array<{
    heading: string;
    instructions: string;
    prompts: string[];
    responseType: string;
  }>) || [];

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      text: "Decision Worksheet",
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: lessonTitle, italics: true, color: "666666" })],
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Name: ____________________    Date: ____________    Group: ____________", color: "666666" }),
      ],
      spacing: { after: 300 },
    })
  );

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Section heading with number
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${i + 1}. ${section.heading}`,
            bold: true,
            size: 26,
          }),
        ],
        spacing: { before: 300, after: 100 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
        },
      })
    );

    // Instructions
    if (section.instructions) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: section.instructions, italics: true, color: "555555", size: 20 }),
          ],
          spacing: { after: 150 },
        })
      );
    }

    // Prompts with response space
    for (const prompt of section.prompts) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${prompt}`, size: 22 })],
          spacing: { after: 80 },
        })
      );

      // Add blank lines for responses
      const lineCount = section.responseType === "paragraph" ? 4 : 2;
      for (let line = 0; line < lineCount; line++) {
        children.push(
          new Paragraph({
            text: "",
            spacing: { after: 50 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            },
          })
        );
      }
    }
  }

  return new Document({ sections: [{ children }] });
}

function buildQuizDocx(
  content: Record<string, unknown>,
  lessonTitle: string
): Document {
  const title = (content.title as string) || "Quiz";
  const instructions = (content.instructions as string) || "";
  const questions = (content.questions as Array<{
    number: number;
    question: string;
    type: string;
    options?: string[];
    answer: string;
    explanation: string;
  }>) || [];

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: lessonTitle, italics: true, color: "666666" })],
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Name: ____________________    Date: ____________", color: "666666" }),
      ],
      spacing: { after: 200 },
    })
  );

  // Instructions
  if (instructions) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: instructions, italics: true })],
        spacing: { after: 300 },
      })
    );
  }

  // Questions
  for (const q of questions) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${q.number}. `, bold: true }),
          new TextRun({ text: q.question }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    if (q.type === "multiple_choice" && q.options) {
      for (const option of q.options) {
        children.push(
          new Paragraph({
            text: `    ${option}`,
            spacing: { after: 40 },
          })
        );
      }
    } else {
      // Short answer / constructed response — blank lines
      const lineCount = q.type === "constructed_response" ? 6 : 3;
      for (let line = 0; line < lineCount; line++) {
        children.push(
          new Paragraph({
            text: "",
            spacing: { after: 50 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            },
          })
        );
      }
    }
  }

  // Answer Key (new page)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(
    new Paragraph({
      text: "ANSWER KEY",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "For teacher use only", italics: true, color: "999999" })],
      spacing: { after: 300 },
    })
  );

  for (const q of questions) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${q.number}. `, bold: true }),
          new TextRun({ text: q.answer, bold: true, color: "1a7f37" }),
        ],
        spacing: { after: 40 },
      })
    );
    if (q.explanation) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: q.explanation, italics: true, color: "666666", size: 20 }),
          ],
          spacing: { after: 150 },
        })
      );
    }
  }

  return new Document({ sections: [{ children }] });
}

// ── Full Lesson Plan Builder ──

function buildLessonPlanDocx(
  content: Record<string, unknown>,
  lessonTitle: string
): Document {
  const sections = (content.sections as Array<{ heading: string; content: string }>) || [];
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: lessonTitle, bold: true, size: 36, font: "Georgia", color: "1a1a2e" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Lesson Plan", size: 24, font: "Georgia", color: "666666", italics: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "4338CA" },
      },
    })
  );

  for (const section of sections) {
    // Section heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: section.heading, bold: true, size: 26, font: "Georgia", color: "4338CA" }),
        ],
        spacing: { before: 300, after: 120 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
      })
    );

    // Section content — split by newlines
    const lines = (section.content || "").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect bullet points
      const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
      const text = isBullet ? trimmed.replace(/^[•\-*]\s*/, "") : trimmed;

      children.push(
        new Paragraph({
          children: [new TextRun({ text: isBullet ? `• ${text}` : text, size: 22, font: "Georgia" })],
          spacing: { after: 80 },
          indent: isBullet ? { left: 360 } : undefined,
        })
      );
    }
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { size: 22, font: "Georgia" },
        },
      },
    },
    sections: [{ children }],
  });
}

// ── Generic Sections Builder (Student Handout, etc.) ──

function buildGenericSectionsDocx(
  content: Record<string, unknown>,
  resourceTitle: string,
  lessonTitle: string
): Document {
  const children: (Paragraph | Table)[] = [];
  const title = (content.title as string) || resourceTitle;
  const subtitle = content.subtitle as string | undefined;

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
    })
  );

  if (subtitle) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: subtitle, italics: true, color: "666666" })],
        spacing: { after: 100 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: lessonTitle, italics: true, color: "999999", size: 20 })],
      spacing: { after: 300 },
    })
  );

  const sections = (content.sections as Array<{ heading: string; content: string }>) || [];

  for (const section of sections) {
    if (section.heading) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.heading, bold: true, size: 24 })],
          spacing: { before: 250, after: 100 },
        })
      );
    }

    const lines = (section.content || "").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
      const text = isBullet ? trimmed.replace(/^[•\-*]\s*/, "") : trimmed;

      children.push(
        new Paragraph({
          children: [new TextRun({ text: isBullet ? `• ${text}` : text, size: 22 })],
          spacing: { after: 80 },
          indent: isBullet ? { left: 360 } : undefined,
        })
      );
    }
  }

  return new Document({ sections: [{ children }] });
}

// ── PPTX Builder ──

async function buildSlidesPptx(
  content: Record<string, unknown>,
  resourceTitle: string,
  lessonTitle: string
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.author = "PlanLab";
  pptx.title = resourceTitle;

  const slides = (content.slides as { title?: string; body?: string; notes?: string }[]) || [];

  if (slides.length === 0) {
    const titleSlide = pptx.addSlide();
    titleSlide.addText(resourceTitle, {
      x: 0.5, y: 1.5, w: 9, h: 1.5,
      fontSize: 36, bold: true, color: "363636", align: "center",
    });
    titleSlide.addText(lessonTitle, {
      x: 0.5, y: 3.2, w: 9, h: 0.8,
      fontSize: 18, color: "666666", align: "center",
    });
  } else {
    for (const slideData of slides) {
      const slide = pptx.addSlide();

      if (slideData.title) {
        slide.addText(slideData.title, {
          x: 0.5, y: 0.3, w: 9, h: 1,
          fontSize: 28, bold: true, color: "363636",
        });
      }

      if (slideData.body) {
        slide.addText(slideData.body, {
          x: 0.5, y: 1.5, w: 9, h: 4.2,
          fontSize: 18, color: "444444", valign: "top",
        });
      }

      if (slideData.notes) {
        slide.addNotes(slideData.notes);
      }
    }
  }

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}

// ── Main Route Handler ──

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        lesson: true,
      },
    });

    if (!resource) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }

    const content = resource.content as Record<string, unknown>;
    const lessonTitle = resource.lesson?.title || "Lesson";
    const filename = `${resource.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}`;

    // Slides → PPTX
    if (resource.type === "slides") {
      const buffer = await buildSlidesPptx(content, resource.title, lessonTitle);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${filename}.pptx"`,
        },
      });
    }

    // All other types → DOCX
    let doc: Document;

    switch (resource.type) {
      case "reading":
        doc = buildBriefingDocx(content, lessonTitle);
        break;
      case "worksheet":
        // Distinguish between role cards and worksheets by content structure
        if (content.roles) {
          doc = buildRoleCardsDocx(content, lessonTitle);
        } else {
          doc = buildWorksheetDocx(content, lessonTitle);
        }
        break;
      case "assessment":
        doc = buildQuizDocx(content, lessonTitle);
        break;
      case "lesson_plan":
        doc = buildLessonPlanDocx(content, lessonTitle);
        break;
      default:
        // Generic fallback — handles student handouts and other section-based resources
        if (content.sections) {
          doc = buildGenericSectionsDocx(content, resource.title, lessonTitle);
        } else {
          doc = new Document({
            sections: [{
              children: [
                new Paragraph({ text: resource.title, heading: HeadingLevel.TITLE }),
                new Paragraph({ text: JSON.stringify(content, null, 2) }),
              ],
            }],
          });
        }
    }

    const buffer = await Packer.toBuffer(doc);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"`,
      },
    });
  } catch (error) {
    console.error("Resource export error:", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}
