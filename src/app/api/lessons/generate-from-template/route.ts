import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

function substituteTemplate(template: string, config: Record<string, string>): string {
  let result = template;

  // Handle {{#field}}...{{/field}} conditional blocks
  for (const [key, value] of Object.entries(config)) {
    const conditionalRegex = new RegExp(`\\{\\{#${key}\\}\\}(.*?)\\{\\{/${key}\\}\\}`, "gs");
    if (value && value.trim()) {
      result = result.replace(conditionalRegex, (_match, content) => {
        return content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      });
    } else {
      result = result.replace(conditionalRegex, "");
    }
  }

  // Handle simple {{field}} substitutions
  for (const [key, value] of Object.entries(config)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }

  return result;
}

async function getCurriculumContext(courseId?: string, gradeLevel?: string): Promise<string> {
  let grade = gradeLevel;

  if (courseId && !grade) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { gradeLevel: true, subject: true },
    });
    grade = course?.gradeLevel;
  }

  if (!grade) return "";

  const standards = await prisma.curriculumStandard.findMany({
    where: {
      subject: "Social Studies",
      gradeLevel: grade,
    },
    take: 20,
  });

  if (standards.length === 0) return "";

  const parts = ["\nBC Curriculum Standards for Grade " + grade + " Social Studies:"];
  for (const std of standards) {
    parts.push(`  [${std.category}] ${std.description}`);
  }
  return parts.join("\n");
}

// Fetch additional context about the unit and course for richer prompts
async function getLessonContext(courseId?: string, unitId?: string): Promise<Record<string, string>> {
  const context: Record<string, string> = {};

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true, subject: true, gradeLevel: true },
    });
    if (course) {
      context.courseName = `${course.title} (${course.subject}, Grade ${course.gradeLevel})`;
    }
  }

  if (unitId) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        title: true,
        bigIdea: true,
        lessons: {
          select: { title: true, order: true },
          orderBy: { order: "asc" },
          take: 10,
        },
      },
    });
    if (unit) {
      context.unitTitle = unit.title;
      if (unit.bigIdea) context.unitBigIdea = unit.bigIdea;
      if (unit.lessons.length > 0) {
        context.priorLessons = unit.lessons.map((l) => l.title).join(", ");
      }
    }
  }

  return context;
}

function parseLesson(content: string) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    hook: parsed.hook || "",
    learningTarget: parsed.learningTarget || "",
    lessonPurpose: parsed.lessonPurpose || "",
    materialsNeeded: parsed.materialsNeeded || "",
    activities: Array.isArray(parsed.activities) ? parsed.activities : [],
    closure: parsed.closure || "",
    assessment: parsed.assessment || "",
    scaffolds: parsed.scaffolds || "",
    extension: parsed.extension || "",
    notes: parsed.notes || "",
    curriculumConnection: {
      bigIdea: parsed.curriculumConnection?.bigIdea || "",
      competencyFocus: parsed.curriculumConnection?.competencyFocus || "",
      contentConnection: parsed.curriculumConnection?.contentConnection || "",
    },
  };
}

// Try to parse partial JSON to extract completed fields
function parsePartialLesson(text: string) {
  // Find the outermost JSON object
  const startIdx = text.indexOf("{");
  if (startIdx === -1) return null;

  const jsonStr = text.slice(startIdx);

  // Try to parse as-is first (complete JSON)
  try {
    const parsed = JSON.parse(jsonStr);
    return { lesson: parseLesson(text), complete: true };
  } catch {
    // Not complete yet — try to extract what we can
  }

  const result: Record<string, unknown> = {};
  const fields = [
    "hook", "learningTarget", "lessonPurpose", "materialsNeeded",
    "closure", "assessment", "scaffolds", "extension", "notes",
  ];

  for (const field of fields) {
    // Match "field": "value" patterns - handle escaped quotes
    const regex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
    const match = jsonStr.match(regex);
    if (match) {
      result[field] = match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
    }
  }

  // Try to extract curriculumConnection
  const ccMatch = jsonStr.match(/"curriculumConnection"\s*:\s*\{([^}]*)\}/);
  if (ccMatch) {
    const ccStr = ccMatch[1];
    const bigIdeaMatch = ccStr.match(/"bigIdea"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const compMatch = ccStr.match(/"competencyFocus"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const contentMatch = ccStr.match(/"contentConnection"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    result.curriculumConnection = {
      bigIdea: bigIdeaMatch ? bigIdeaMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n") : "",
      competencyFocus: compMatch ? compMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n") : "",
      contentConnection: contentMatch ? contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n") : "",
    };
  }

  // Try to extract activities array
  const activitiesStart = jsonStr.indexOf('"activities"');
  if (activitiesStart !== -1) {
    const afterActivities = jsonStr.slice(activitiesStart);
    const arrStart = afterActivities.indexOf("[");
    if (arrStart !== -1) {
      // Find matching bracket or end of available text
      let depth = 0;
      let arrEnd = -1;
      for (let i = arrStart; i < afterActivities.length; i++) {
        if (afterActivities[i] === "[") depth++;
        if (afterActivities[i] === "]") {
          depth--;
          if (depth === 0) { arrEnd = i; break; }
        }
      }
      if (arrEnd !== -1) {
        try {
          result.activities = JSON.parse(afterActivities.slice(arrStart, arrEnd + 1));
        } catch { /* incomplete */ }
      }
    }
  }

  if (Object.keys(result).length === 0) return null;
  return { lesson: result, complete: false };
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { templateId, config, mode, title, courseId, courseGradeLevel, unitId, currentLesson, feedback } = body;

    const template = await prisma.lessonTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    const curriculumContext = await getCurriculumContext(courseId, courseGradeLevel || config?.grade);
    const lessonContext = await getLessonContext(courseId, unitId);

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are a curriculum planning assistant helping a teacher build lesson plans for BC (British Columbia) Social Studies (Grades 6-12). Be practical, specific, and engaging. Generate content that is ready to use — not generic or placeholder-like. Always align to BC curriculum standards where possible.
${curriculumContext}`;

    // ITERATE mode — stays non-streaming (fast enough, needs atomic update)
    if (mode === "iterate" && currentLesson && feedback) {
      const iteratePrompt = `Here is the current lesson plan:
${JSON.stringify(currentLesson, null, 2)}

The teacher wants the following changes:
"${feedback}"

Apply the requested changes and return the COMPLETE updated lesson as JSON with these fields:
{"hook":"...","learningTarget":"...","lessonPurpose":"...","materialsNeeded":"...","activities":[{"name":"...","duration":"X","description":"..."}],"closure":"...","assessment":"...","scaffolds":"...","extension":"...","curriculumConnection":{"bigIdea":"...","competencyFocus":"...","contentConnection":"..."}}

Important: Return the full lesson JSON, not just the changed parts. Make the changes the teacher requested while keeping everything else coherent.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: iteratePrompt }],
      });

      const content = response.content[0].type === "text" ? response.content[0].text : "";
      const lesson = parseLesson(content);
      return Response.json({ lesson });
    }

    // AUTO mode — streaming
    if (mode === "auto") {
      const prompt = substituteTemplate(template.promptTemplate as string, {
        ...config,
        ...lessonContext,
        title: title || "",
      });

      // Use higher token limit for rich templates (Historical Decision-Making, etc.)
      const isRichTemplate = (template.promptTemplate as string).length > 2000;
      const maxTokens = isRichTemplate ? 8192 : 4096;

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });

      let fullText = "";

      const readable = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          stream.on("text", (text) => {
            fullText += text;

            // Try to parse partial content and send updates
            const partial = parsePartialLesson(fullText);
            if (partial) {
              const event = `data: ${JSON.stringify({ type: partial.complete ? "complete" : "partial", lesson: partial.lesson })}\n\n`;
              controller.enqueue(encoder.encode(event));
            }
          });

          stream.on("end", () => {
            // Send final complete lesson
            try {
              const lesson = parseLesson(fullText);
              const event = `data: ${JSON.stringify({ type: "complete", lesson })}\n\n`;
              controller.enqueue(encoder.encode(event));
            } catch (err) {
              const event = `data: ${JSON.stringify({ type: "error", error: "Failed to parse lesson" })}\n\n`;
              controller.enqueue(encoder.encode(event));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          });

          stream.on("error", (err) => {
            const event = `data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`;
            controller.enqueue(encoder.encode(event));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          });
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // OPTIONS mode — generate 3 lightweight summaries (non-streaming, fast)
    if (mode === "options") {
      const basePrompt = substituteTemplate(template.promptTemplate as string, {
        ...config,
        ...lessonContext,
        title: title || "",
      });

      const summariesPrompt = `${basePrompt}

IMPORTANT: Instead of generating full lesson plans, generate THREE DISTINCT lesson SUMMARIES. Each should take a meaningfully different pedagogical approach. Keep each summary brief — just enough for the teacher to choose which direction they prefer.

Return as a JSON array with exactly 3 summary objects:
[
  {
    "title": "A short descriptive title for this approach (e.g. 'Gallery Walk + Debate')",
    "approach": "1-2 sentence description of the overall pedagogical approach",
    "hookPreview": "1 sentence preview of the hook/opener",
    "keyActivities": ["Activity 1 name", "Activity 2 name", "Activity 3 name"],
    "assessmentStyle": "1 sentence on how understanding is checked"
  },
  {...},
  {...}
]

Make each variation meaningfully different — different engagement strategies, different activity types, different assessment approaches.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: summariesPrompt }],
      });

      const content = response.content[0].type === "text" ? response.content[0].text : "";

      try {
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const summaries = JSON.parse(arrayMatch[0]);
          return Response.json({ summaries });
        }
      } catch { /* fallback */ }

      return Response.json({ summaries: [] });
    }

    // BUILD mode — take a selected summary and generate the full lesson (streaming)
    if (mode === "build" && body.summary) {
      const basePrompt = substituteTemplate(template.promptTemplate as string, {
        ...config,
        ...lessonContext,
        title: title || "",
      });

      const buildPrompt = `${basePrompt}

The teacher chose this specific approach for the lesson:
- Title: ${body.summary.title}
- Approach: ${body.summary.approach}
- Hook preview: ${body.summary.hookPreview}
- Key activities: ${body.summary.keyActivities?.join(", ")}
- Assessment style: ${body.summary.assessmentStyle}

Build out the FULL lesson plan following this chosen approach. Be detailed and practical.

Return as JSON with these fields:
{"hook":"...","learningTarget":"...","lessonPurpose":"...","materialsNeeded":"...","activities":[{"name":"...","duration":"X","description":"..."}],"closure":"...","assessment":"...","scaffolds":"...","extension":"...","notes":"...","curriculumConnection":{"bigIdea":"...","competencyFocus":"...","contentConnection":"..."}}`;

      const isRichBuild = (template.promptTemplate as string).length > 2000;
      const buildMaxTokens = isRichBuild ? 8192 : 4096;

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: buildMaxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: buildPrompt }],
      });

      let fullText = "";

      const readable = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          stream.on("text", (text) => {
            fullText += text;
            const partial = parsePartialLesson(fullText);
            if (partial) {
              const event = `data: ${JSON.stringify({ type: partial.complete ? "complete" : "partial", lesson: partial.lesson })}\n\n`;
              controller.enqueue(encoder.encode(event));
            }
          });

          stream.on("end", () => {
            try {
              const lesson = parseLesson(fullText);
              const event = `data: ${JSON.stringify({ type: "complete", lesson })}\n\n`;
              controller.enqueue(encoder.encode(event));
            } catch {
              const event = `data: ${JSON.stringify({ type: "error", error: "Failed to parse lesson" })}\n\n`;
              controller.enqueue(encoder.encode(event));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          });

          stream.on("error", (err) => {
            const event = `data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`;
            controller.enqueue(encoder.encode(event));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          });
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return Response.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("Failed to generate from template:", error);
    return Response.json(
      { error: "Failed to generate lesson" },
      { status: 500 }
    );
  }
}
