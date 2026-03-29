import { prisma } from "@/lib/db";
import { getAuthedClient, isAuthenticated } from "@/lib/google-auth";
import { google } from "googleapis";

// Build Google Docs API requests for each resource type
function buildBriefingRequests(content: Record<string, unknown>, lessonTitle: string) {
  const requests: object[] = [];
  const format = (content.format as string) || "memo";
  const from = (content.from as string) || "";
  const to = (content.to as string) || "";
  const date = (content.date as string) || "";
  const subject = (content.subject as string) || "";
  const body = (content.body as string[]) || [];
  const closingTask = (content.closingTask as string) || "";

  const headerLabel =
    format === "letter" ? "LETTER" : format === "brief" ? "ADVISORY BRIEF" : "CONFIDENTIAL MEMO";

  // Build content from bottom to top (Google Docs inserts at index 1)
  const textParts: { text: string; bold?: boolean; italic?: boolean; fontSize?: number; color?: string }[] = [];

  // Header
  textParts.push({ text: headerLabel + "\n\n", bold: true, fontSize: 16 });

  // Meta fields
  if (from) textParts.push({ text: "FROM: ", bold: true }, { text: from + "\n" });
  if (to) textParts.push({ text: "TO: ", bold: true }, { text: to + "\n" });
  if (date) textParts.push({ text: "DATE: ", bold: true }, { text: date + "\n" });
  if (subject) textParts.push({ text: "RE: ", bold: true }, { text: subject + "\n" });
  textParts.push({ text: "\n" + "─".repeat(50) + "\n\n" });

  // Body
  for (const paragraph of body) {
    textParts.push({ text: paragraph + "\n\n" });
  }

  // Closing task
  if (closingTask) {
    textParts.push({ text: "─".repeat(50) + "\n\n" });
    textParts.push({ text: "YOUR TASK: ", bold: true, fontSize: 12 });
    textParts.push({ text: closingTask + "\n", italic: true });
  }

  // Insert all text at index 1
  let fullText = textParts.map((p) => p.text).join("");
  requests.push({ insertText: { location: { index: 1 }, text: fullText } });

  // Apply formatting
  let offset = 1;
  for (const part of textParts) {
    const len = part.text.length;
    if (part.bold || part.italic || part.fontSize) {
      const style: Record<string, unknown> = {};
      const fields: string[] = [];
      if (part.bold) { style.bold = true; fields.push("bold"); }
      if (part.italic) { style.italic = true; fields.push("italic"); }
      if (part.fontSize) { style.fontSize = { magnitude: part.fontSize, unit: "PT" }; fields.push("fontSize"); }
      requests.push({
        updateTextStyle: {
          range: { startIndex: offset, endIndex: offset + len },
          textStyle: style,
          fields: fields.join(","),
        },
      });
    }
    offset += len;
  }

  return requests;
}

function buildRoleCardsRequests(content: Record<string, unknown>, lessonTitle: string) {
  const roles = (content.roles as Array<{
    title: string; who: string; whatTheyWant: string; whatTheyFear: string; biasOrPriority: string;
  }>) || [];

  const requests: object[] = [];
  const lines: { text: string; bold?: boolean; fontSize?: number; color?: string }[] = [];

  lines.push({ text: "ROLE CARDS\n", bold: true, fontSize: 18 });
  lines.push({ text: lessonTitle + "\n\n", fontSize: 10 });

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    lines.push({ text: "═".repeat(50) + "\n" });
    lines.push({ text: role.title + "\n", bold: true, fontSize: 14 });
    lines.push({ text: "═".repeat(50) + "\n\n" });
    lines.push({ text: "WHO YOU ARE: ", bold: true });
    lines.push({ text: role.who + "\n\n" });
    lines.push({ text: "WHAT YOU WANT: ", bold: true });
    lines.push({ text: role.whatTheyWant + "\n\n" });
    lines.push({ text: "WHAT YOU FEAR: ", bold: true });
    lines.push({ text: role.whatTheyFear + "\n\n" });
    lines.push({ text: "YOUR BIAS / PRIORITY: ", bold: true });
    lines.push({ text: role.biasOrPriority + "\n" });
    if (i < roles.length - 1) lines.push({ text: "\n\n" });
  }

  const fullText = lines.map((l) => l.text).join("");
  requests.push({ insertText: { location: { index: 1 }, text: fullText } });

  let offset = 1;
  for (const part of lines) {
    const len = part.text.length;
    if (part.bold || part.fontSize) {
      const style: Record<string, unknown> = {};
      const fields: string[] = [];
      if (part.bold) { style.bold = true; fields.push("bold"); }
      if (part.fontSize) { style.fontSize = { magnitude: part.fontSize, unit: "PT" }; fields.push("fontSize"); }
      requests.push({
        updateTextStyle: {
          range: { startIndex: offset, endIndex: offset + len },
          textStyle: style,
          fields: fields.join(","),
        },
      });
    }
    offset += len;
  }

  return requests;
}

function buildWorksheetRequests(content: Record<string, unknown>, lessonTitle: string) {
  const sections = (content.sections as Array<{
    heading: string; instructions: string; prompts: string[]; responseType: string;
  }>) || [];

  const requests: object[] = [];
  const lines: { text: string; bold?: boolean; italic?: boolean; fontSize?: number }[] = [];

  lines.push({ text: "DECISION WORKSHEET\n", bold: true, fontSize: 18 });
  lines.push({ text: lessonTitle + "\n\n", fontSize: 10 });
  lines.push({ text: "Name: ____________________    Date: ____________    Group: ____________\n\n", italic: true });

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    lines.push({ text: `${i + 1}. ${section.heading}\n`, bold: true, fontSize: 13 });
    if (section.instructions) {
      lines.push({ text: section.instructions + "\n\n", italic: true });
    }
    for (const prompt of section.prompts) {
      lines.push({ text: `• ${prompt}\n` });
      const lineCount = section.responseType === "paragraph" ? 4 : 2;
      for (let l = 0; l < lineCount; l++) {
        lines.push({ text: "_______________________________________________________________\n" });
      }
      lines.push({ text: "\n" });
    }
    lines.push({ text: "\n" });
  }

  const fullText = lines.map((l) => l.text).join("");
  requests.push({ insertText: { location: { index: 1 }, text: fullText } });

  let offset = 1;
  for (const part of lines) {
    const len = part.text.length;
    if (part.bold || part.italic || part.fontSize) {
      const style: Record<string, unknown> = {};
      const fields: string[] = [];
      if (part.bold) { style.bold = true; fields.push("bold"); }
      if (part.italic) { style.italic = true; fields.push("italic"); }
      if (part.fontSize) { style.fontSize = { magnitude: part.fontSize, unit: "PT" }; fields.push("fontSize"); }
      requests.push({
        updateTextStyle: {
          range: { startIndex: offset, endIndex: offset + len },
          textStyle: style,
          fields: fields.join(","),
        },
      });
    }
    offset += len;
  }

  return requests;
}

function buildQuizRequests(content: Record<string, unknown>, lessonTitle: string) {
  const title = (content.title as string) || "Quiz";
  const instructions = (content.instructions as string) || "";
  const questions = (content.questions as Array<{
    number: number; question: string; type: string; options?: string[]; answer: string; explanation: string;
  }>) || [];

  const requests: object[] = [];
  const lines: { text: string; bold?: boolean; italic?: boolean; fontSize?: number }[] = [];

  lines.push({ text: title.toUpperCase() + "\n", bold: true, fontSize: 18 });
  lines.push({ text: lessonTitle + "\n\n", fontSize: 10 });
  lines.push({ text: "Name: ____________________    Date: ____________\n\n", italic: true });
  if (instructions) lines.push({ text: instructions + "\n\n", italic: true });

  for (const q of questions) {
    lines.push({ text: `${q.number}. `, bold: true });
    lines.push({ text: q.question + "\n" });
    if (q.type === "multiple_choice" && q.options) {
      for (const option of q.options) {
        lines.push({ text: `    ${option}\n` });
      }
    } else {
      const lineCount = q.type === "constructed_response" ? 5 : 3;
      for (let l = 0; l < lineCount; l++) {
        lines.push({ text: "_______________________________________________________________\n" });
      }
    }
    lines.push({ text: "\n" });
  }

  // Answer key
  lines.push({ text: "\n\n" + "═".repeat(50) + "\n" });
  lines.push({ text: "ANSWER KEY\n", bold: true, fontSize: 14 });
  lines.push({ text: "For teacher use only\n\n", italic: true });

  for (const q of questions) {
    lines.push({ text: `${q.number}. `, bold: true });
    lines.push({ text: q.answer + "\n", bold: true });
    if (q.explanation) lines.push({ text: q.explanation + "\n\n", italic: true });
  }

  const fullText = lines.map((l) => l.text).join("");
  requests.push({ insertText: { location: { index: 1 }, text: fullText } });

  let offset = 1;
  for (const part of lines) {
    const len = part.text.length;
    if (part.bold || part.italic || part.fontSize) {
      const style: Record<string, unknown> = {};
      const fields: string[] = [];
      if (part.bold) { style.bold = true; fields.push("bold"); }
      if (part.italic) { style.italic = true; fields.push("italic"); }
      if (part.fontSize) { style.fontSize = { magnitude: part.fontSize, unit: "PT" }; fields.push("fontSize"); }
      requests.push({
        updateTextStyle: {
          range: { startIndex: offset, endIndex: offset + len },
          textStyle: style,
          fields: fields.join(","),
        },
      });
    }
    offset += len;
  }

  return requests;
}

function buildSectionedDocRequests(content: Record<string, unknown>, resourceTitle: string, lessonTitle: string) {
  const sections = (content.sections as Array<{ heading: string; content: string }>) || [];
  const requests: object[] = [];
  const lines: { text: string; bold?: boolean; italic?: boolean; fontSize?: number }[] = [];

  lines.push({ text: resourceTitle.toUpperCase() + "\n", bold: true, fontSize: 18 });
  lines.push({ text: lessonTitle + "\n\n", italic: true, fontSize: 10 });

  // Add subtitle if present
  const subtitle = content.subtitle as string | undefined;
  const title = content.title as string | undefined;
  if (title && title !== resourceTitle) {
    lines.push({ text: title + "\n\n", bold: true, fontSize: 14 });
  }
  if (subtitle) {
    lines.push({ text: subtitle + "\n\n", italic: true });
  }

  for (const section of sections) {
    if (section.heading) {
      lines.push({ text: section.heading + "\n", bold: true, fontSize: 13 });
    }
    const sectionContent = (section.content || "").split("\n");
    for (const line of sectionContent) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      lines.push({ text: trimmed + "\n" });
    }
    lines.push({ text: "\n" });
  }

  const fullText = lines.map((l) => l.text).join("");
  requests.push({ insertText: { location: { index: 1 }, text: fullText } });

  let offset = 1;
  for (const part of lines) {
    const len = part.text.length;
    if (part.bold || part.italic || part.fontSize) {
      const style: Record<string, unknown> = {};
      const fields: string[] = [];
      if (part.bold) { style.bold = true; fields.push("bold"); }
      if (part.italic) { style.italic = true; fields.push("italic"); }
      if (part.fontSize) { style.fontSize = { magnitude: part.fontSize, unit: "PT" }; fields.push("fontSize"); }
      requests.push({
        updateTextStyle: {
          range: { startIndex: offset, endIndex: offset + len },
          textStyle: style,
          fields: fields.join(","),
        },
      });
    }
    offset += len;
  }

  return requests;
}

function buildStudentWorkbookRequests(content: Record<string, unknown>, lessonTitle: string) {
  const compellingQuestion = (content.compellingQuestion as string) || "";
  const supportingQuestions = (content.supportingQuestions as string[]) || [];
  const learningTarget = (content.learningTarget as string) || "";
  const vocabularyTracker = (content.vocabularyTracker as Array<{
    term: string; definition: string; contextSentence: string;
  }>) || [];
  const sourceAnalysisSections = (content.sourceAnalysisSections as Array<{
    sourceTitle: string; sourceType: string; sourceAttribution: string;
    isVerified: boolean; teacherNote: string; contextNote: string;
    analysisFramework: string; analysisPrompts: string[]; responseLineCount: number;
  }>) || [];
  const formativeCheck = (content.formativeCheck as { instructions: string; questions: string[] }) || { instructions: "", questions: [] };
  const synthesisPrompt = (content.synthesisPrompt as string) || "";

  const requests: object[] = [];
  const lines: { text: string; bold?: boolean; italic?: boolean; fontSize?: number }[] = [];

  // Title page
  lines.push({ text: compellingQuestion + "\n\n", bold: true, fontSize: 20 });
  lines.push({ text: lessonTitle + "\n\n", fontSize: 12 });
  lines.push({ text: "Name: ______________________________    Date: ______________    Class: ______________\n\n", italic: true });
  lines.push({ text: "─".repeat(60) + "\n\n" });

  // Supporting Questions
  lines.push({ text: "SUPPORTING QUESTIONS\n", bold: true, fontSize: 14 });
  for (const sq of supportingQuestions) {
    lines.push({ text: `• ${sq}\n` });
  }
  lines.push({ text: "\n" });

  // Learning Target
  lines.push({ text: "LEARNING TARGET\n", bold: true, fontSize: 14 });
  lines.push({ text: learningTarget + "\n\n" });

  // Vocabulary Tracker
  if (vocabularyTracker.length > 0) {
    lines.push({ text: "VOCABULARY TRACKER\n", bold: true, fontSize: 14 });
    lines.push({ text: "\n" });
    // Header row
    lines.push({ text: "Term", bold: true });
    lines.push({ text: "  |  " });
    lines.push({ text: "Definition", bold: true });
    lines.push({ text: "  |  " });
    lines.push({ text: "Context", bold: true });
    lines.push({ text: "  |  " });
    lines.push({ text: "My Notes\n", bold: true });
    lines.push({ text: "─".repeat(60) + "\n" });
    for (const v of vocabularyTracker) {
      lines.push({ text: v.term, bold: true });
      lines.push({ text: `  |  ${v.definition}  |  ` });
      lines.push({ text: v.contextSentence, italic: true });
      lines.push({ text: "  |  _______________\n" });
    }
    lines.push({ text: "\n" });
  }

  // Source Analysis Sections
  for (let i = 0; i < sourceAnalysisSections.length; i++) {
    const source = sourceAnalysisSections[i];
    lines.push({ text: "═".repeat(60) + "\n" });
    lines.push({ text: `SOURCE ${i + 1}: ${source.sourceTitle}\n`, bold: true, fontSize: 14 });
    lines.push({ text: `Type: ${source.sourceType}    Attribution: ${source.sourceAttribution}\n`, italic: true });

    if (!source.isVerified && source.teacherNote) {
      lines.push({ text: `⚠ [TEACHER TO SUPPLY] ${source.teacherNote}\n`, bold: true });
    }

    if (source.contextNote) {
      lines.push({ text: `Context: ${source.contextNote}\n`, italic: true });
    }

    lines.push({ text: "\n" });
    lines.push({ text: `── ${source.analysisFramework.toUpperCase()} ──\n`, bold: true, fontSize: 12 });
    lines.push({ text: "\n" });

    const lineCount = source.responseLineCount || 4;
    for (const prompt of source.analysisPrompts) {
      lines.push({ text: `• ${prompt}\n` });
      for (let l = 0; l < lineCount; l++) {
        lines.push({ text: "_______________________________________________________________\n" });
      }
      lines.push({ text: "\n" });
    }
  }

  // Formative Check
  lines.push({ text: "═".repeat(60) + "\n" });
  lines.push({ text: "FORMATIVE CHECK\n", bold: true, fontSize: 14 });
  if (formativeCheck.instructions) {
    lines.push({ text: formativeCheck.instructions + "\n\n", italic: true });
  }
  for (let qi = 0; qi < formativeCheck.questions.length; qi++) {
    lines.push({ text: `${qi + 1}. ${formativeCheck.questions[qi]}\n` });
    for (let l = 0; l < 4; l++) {
      lines.push({ text: "_______________________________________________________________\n" });
    }
    lines.push({ text: "\n" });
  }

  // Synthesis
  lines.push({ text: "═".repeat(60) + "\n" });
  lines.push({ text: "SYNTHESIS\n", bold: true, fontSize: 14 });
  lines.push({ text: synthesisPrompt + "\n\n" });
  for (let l = 0; l < 16; l++) {
    lines.push({ text: "_______________________________________________________________\n" });
  }

  const fullText = lines.map((l) => l.text).join("");
  requests.push({ insertText: { location: { index: 1 }, text: fullText } });

  let offset = 1;
  for (const part of lines) {
    const len = part.text.length;
    if (part.bold || part.italic || part.fontSize) {
      const style: Record<string, unknown> = {};
      const fields: string[] = [];
      if (part.bold) { style.bold = true; fields.push("bold"); }
      if (part.italic) { style.italic = true; fields.push("italic"); }
      if (part.fontSize) { style.fontSize = { magnitude: part.fontSize, unit: "PT" }; fields.push("fontSize"); }
      requests.push({
        updateTextStyle: {
          range: { startIndex: offset, endIndex: offset + len },
          textStyle: style,
          fields: fields.join(","),
        },
      });
    }
    offset += len;
  }

  return requests;
}

function buildTeacherGuideRequests(content: Record<string, unknown>, lessonTitle: string) {
  const compellingQuestion = (content.compellingQuestion as string) || "";
  const supportingQuestions = (content.supportingQuestions as string[]) || [];
  const learningTarget = (content.learningTarget as string) || "";
  const vocabularyTracker = (content.vocabularyTracker as Array<{
    term: string; definition: string; contextSentence: string; teachingStrategy: string;
  }>) || [];
  const sourceAnalysisSections = (content.sourceAnalysisSections as Array<{
    sourceTitle: string; sourceType: string; sourceAttribution: string;
    isVerified: boolean; teacherNote: string; contextNote: string;
    analysisFramework: string; analysisPrompts: string[];
    expectedResponses: string[]; teachingNotes: string; followUpQuestions: string[];
  }>) || [];
  const formativeCheck = (content.formativeCheck as {
    instructions: string; questions: string[]; rubric: string; sampleResponses: string[];
  }) || { instructions: "", questions: [], rubric: "", sampleResponses: [] };
  const synthesisPrompt = (content.synthesisPrompt as string) || "";
  const synthesisRubric = (content.synthesisRubric as string) || "";

  const requests: object[] = [];
  const lines: { text: string; bold?: boolean; italic?: boolean; fontSize?: number }[] = [];

  // Header
  lines.push({ text: "TEACHER GUIDE\n", bold: true, fontSize: 20 });
  lines.push({ text: lessonTitle + "\n", fontSize: 12 });
  lines.push({ text: compellingQuestion + "\n\n", bold: true, fontSize: 14 });
  lines.push({ text: "─".repeat(60) + "\n\n" });

  // Supporting Questions
  lines.push({ text: "SUPPORTING QUESTIONS\n", bold: true, fontSize: 14 });
  for (const sq of supportingQuestions) {
    lines.push({ text: `• ${sq}\n` });
  }
  lines.push({ text: "\n" });

  // Learning Target
  lines.push({ text: "LEARNING TARGET\n", bold: true, fontSize: 14 });
  lines.push({ text: learningTarget + "\n\n" });

  // Vocabulary with Teaching Strategies
  if (vocabularyTracker.length > 0) {
    lines.push({ text: "VOCABULARY TRACKER\n", bold: true, fontSize: 14 });
    lines.push({ text: "\n" });
    for (const v of vocabularyTracker) {
      lines.push({ text: v.term, bold: true });
      lines.push({ text: `: ${v.definition}\n` });
      lines.push({ text: `  Context: ${v.contextSentence}\n`, italic: true });
      lines.push({ text: `  Teaching Strategy: `, bold: true });
      lines.push({ text: `${v.teachingStrategy}\n` });
      lines.push({ text: "\n" });
    }
  }

  // Source Analysis with Expected Responses
  for (let i = 0; i < sourceAnalysisSections.length; i++) {
    const source = sourceAnalysisSections[i];
    lines.push({ text: "═".repeat(60) + "\n" });
    lines.push({ text: `SOURCE ${i + 1}: ${source.sourceTitle}\n`, bold: true, fontSize: 14 });
    lines.push({ text: `Type: ${source.sourceType}    Attribution: ${source.sourceAttribution}\n`, italic: true });

    if (!source.isVerified && source.teacherNote) {
      lines.push({ text: `⚠ [TEACHER TO SUPPLY] ${source.teacherNote}\n`, bold: true });
    }
    if (source.contextNote) {
      lines.push({ text: `Context: ${source.contextNote}\n\n`, italic: true });
    }

    // Teaching Notes
    if (source.teachingNotes) {
      lines.push({ text: "TEACHING NOTES: ", bold: true });
      lines.push({ text: source.teachingNotes + "\n\n" });
    }

    lines.push({ text: `── ${source.analysisFramework.toUpperCase()} ──\n\n`, bold: true, fontSize: 12 });

    // Prompts + Expected Responses
    for (let pi = 0; pi < source.analysisPrompts.length; pi++) {
      lines.push({ text: `${pi + 1}. ${source.analysisPrompts[pi]}\n` });
      if (source.expectedResponses?.[pi]) {
        lines.push({ text: `   ✓ Expected: `, bold: true });
        lines.push({ text: `${source.expectedResponses[pi]}\n\n` });
      }
    }

    // Follow-up Questions
    if (source.followUpQuestions?.length > 0) {
      lines.push({ text: "\nFOLLOW-UP QUESTIONS:\n", bold: true });
      for (const q of source.followUpQuestions) {
        lines.push({ text: `  → ${q}\n` });
      }
    }
    lines.push({ text: "\n" });
  }

  // Formative Check with Rubric
  lines.push({ text: "═".repeat(60) + "\n" });
  lines.push({ text: "FORMATIVE CHECK\n", bold: true, fontSize: 14 });
  if (formativeCheck.instructions) {
    lines.push({ text: formativeCheck.instructions + "\n\n", italic: true });
  }
  for (let qi = 0; qi < formativeCheck.questions.length; qi++) {
    lines.push({ text: `${qi + 1}. ${formativeCheck.questions[qi]}\n\n` });
  }
  if (formativeCheck.rubric) {
    lines.push({ text: "RUBRIC:\n", bold: true });
    lines.push({ text: formativeCheck.rubric + "\n\n" });
  }
  if (formativeCheck.sampleResponses?.length > 0) {
    lines.push({ text: "SAMPLE RESPONSES:\n", bold: true });
    for (const r of formativeCheck.sampleResponses) {
      lines.push({ text: `  ✓ ${r}\n\n` });
    }
  }

  // Synthesis + Rubric
  lines.push({ text: "═".repeat(60) + "\n" });
  lines.push({ text: "SYNTHESIS\n", bold: true, fontSize: 14 });
  lines.push({ text: synthesisPrompt + "\n\n" });
  if (synthesisRubric) {
    lines.push({ text: "SYNTHESIS RUBRIC:\n", bold: true });
    lines.push({ text: synthesisRubric + "\n" });
  }

  const fullText = lines.map((l) => l.text).join("");
  requests.push({ insertText: { location: { index: 1 }, text: fullText } });

  let offset = 1;
  for (const part of lines) {
    const len = part.text.length;
    if (part.bold || part.italic || part.fontSize) {
      const style: Record<string, unknown> = {};
      const fields: string[] = [];
      if (part.bold) { style.bold = true; fields.push("bold"); }
      if (part.italic) { style.italic = true; fields.push("italic"); }
      if (part.fontSize) { style.fontSize = { magnitude: part.fontSize, unit: "PT" }; fields.push("fontSize"); }
      requests.push({
        updateTextStyle: {
          range: { startIndex: offset, endIndex: offset + len },
          textStyle: style,
          fields: fields.join(","),
        },
      });
    }
    offset += len;
  }

  return requests;
}

// ── Main Route Handler ──

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated()) {
    return Response.json({ error: "Not authenticated with Google", needsAuth: true }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const folderId = body.folderId as string | undefined;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { lesson: true },
    });

    if (!resource) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }

    const client = getAuthedClient();
    if (!client) {
      return Response.json({ error: "Google auth expired", needsAuth: true }, { status: 401 });
    }

    const docs = google.docs({ version: "v1", auth: client });
    const drive = google.drive({ version: "v3", auth: client });

    const content = resource.content as Record<string, unknown>;
    const lessonTitle = resource.lesson?.title || "Lesson";

    // Slides should use the Google Slides endpoint instead
    if (resource.type === "slides") {
      return Response.json({
        error: "Use /api/export/google-slides/[id] for slide decks",
      }, { status: 400 });
    }

    // Create blank Google Doc
    const docTitle = `${resource.title} — ${lessonTitle}`;
    const createRes = await docs.documents.create({
      requestBody: { title: docTitle },
    });

    const documentId = createRes.data.documentId;
    if (!documentId) {
      throw new Error("Failed to create Google Doc");
    }

    // Build formatting requests based on resource type
    let batchRequests: object[] = [];

    switch (resource.type) {
      case "reading":
        batchRequests = buildBriefingRequests(content, lessonTitle);
        break;
      case "worksheet":
        batchRequests = content.roles
          ? buildRoleCardsRequests(content, lessonTitle)
          : buildWorksheetRequests(content, lessonTitle);
        break;
      case "assessment":
        batchRequests = buildQuizRequests(content, lessonTitle);
        break;
      case "lesson_plan":
        batchRequests = buildSectionedDocRequests(content, resource.title, lessonTitle);
        break;
      case "student_workbook":
        batchRequests = buildStudentWorkbookRequests(content, lessonTitle);
        break;
      case "teacher_guide":
        batchRequests = buildTeacherGuideRequests(content, lessonTitle);
        break;
      default:
        // Generic sections-based resource (student handout, etc.)
        if (content.sections) {
          batchRequests = buildSectionedDocRequests(content, resource.title, lessonTitle);
        } else {
          batchRequests = [
            { insertText: { location: { index: 1 }, text: JSON.stringify(content, null, 2) } },
          ];
        }
    }

    // Apply all formatting
    if (batchRequests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: batchRequests },
      });
    }

    // Move to selected folder if specified
    if (folderId) {
      try {
        // Get current parents, then move
        const file = await drive.files.get({
          fileId: documentId,
          fields: "parents",
        });
        const previousParents = (file.data.parents || []).join(",");
        await drive.files.update({
          fileId: documentId,
          addParents: folderId,
          removeParents: previousParents,
          fields: "id, parents",
        });
      } catch (moveErr) {
        console.error("Failed to move doc to folder:", moveErr);
        // Don't fail the whole request — doc was still created
      }
    }

    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    return Response.json({
      success: true,
      documentId,
      url: docUrl,
      title: docTitle,
    });
  } catch (error) {
    console.error("Google Doc export error:", error);
    return Response.json({ error: "Failed to create Google Doc" }, { status: 500 });
  }
}
