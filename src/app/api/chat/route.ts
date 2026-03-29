import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { createAnthropicClient } from "@/lib/ai";

const SYSTEM_PROMPT = `You are a curriculum planning assistant for PlanLab, a tool designed to help teachers plan and organize their courses, units, and lessons. You help with:

- Designing course structures and unit sequences
- Writing lesson plans with hooks, learning objectives, activities, and assessments
- Aligning curriculum to BC (British Columbia) curriculum standards
- Suggesting differentiation strategies for diverse learners
- Creating engaging activities and assessment ideas
- Identifying key vocabulary and transferable concepts
- Connecting lessons to big ideas and competencies

When given context about a specific course, unit, or lesson, tailor your responses to that context. Be practical, specific, and supportive. Format your responses clearly using markdown when helpful.`;

async function gatherContext(body: {
  courseId?: string;
  unitId?: string;
  lessonId?: string;
  resourceId?: string;
}) {
  const parts: string[] = [];

  if (body.lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: body.lessonId },
      include: {
        resources: true,
        unit: {
          include: { course: true },
        },
        tags: true,
      },
    });
    if (lesson) {
      if (lesson.unit?.course) {
        parts.push(
          `Course: "${lesson.unit.course.title}" (${lesson.unit.course.subject}, Grade ${lesson.unit.course.gradeLevel})`
        );
      }
      if (lesson.unit) {
        parts.push(
          `Unit: "${lesson.unit.title}" - ${lesson.unit.description || "No description"}`
        );
        if (lesson.unit.bigIdea) {
          parts.push(`Big Idea: ${lesson.unit.bigIdea}`);
        }
      }
      parts.push(`Lesson: "${lesson.title}"`);
      if (lesson.hook) parts.push(`Hook: ${lesson.hook}`);
      if (lesson.learningObjectives)
        parts.push(`Learning Objectives: ${lesson.learningObjectives}`);
      if (lesson.curriculumConnection)
        parts.push(`Curriculum Connection: ${lesson.curriculumConnection}`);
      if (lesson.keyVocabulary)
        parts.push(`Key Vocabulary: ${lesson.keyVocabulary}`);
      if (lesson.activities && lesson.activities !== "[]")
        parts.push(
          `Activities: ${JSON.stringify(lesson.activities)}`
        );
      if (lesson.assessment) parts.push(`Assessment: ${lesson.assessment}`);
      if (lesson.resources.length > 0) {
        parts.push(
          `Resources: ${lesson.resources.map((r) => `${r.title} (${r.type})`).join(", ")}`
        );
      }
    }
  } else if (body.unitId) {
    const unit = await prisma.unit.findUnique({
      where: { id: body.unitId },
      include: {
        lessons: { orderBy: { order: "asc" } },
        course: true,
        tags: true,
      },
    });
    if (unit) {
      if (unit.course) {
        parts.push(
          `Course: "${unit.course.title}" (${unit.course.subject}, Grade ${unit.course.gradeLevel})`
        );
      }
      parts.push(
        `Unit: "${unit.title}" - ${unit.description || "No description"}`
      );
      if (unit.bigIdea) parts.push(`Big Idea: ${unit.bigIdea}`);
      if (unit.lessons.length > 0) {
        parts.push(
          `Lessons in this unit: ${unit.lessons.map((l) => l.title).join(", ")}`
        );
      }
    }
  } else if (body.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
      include: {
        units: {
          orderBy: { order: "asc" },
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
        },
      },
    });
    if (course) {
      parts.push(
        `Course: "${course.title}" (${course.subject}, Grade ${course.gradeLevel})`
      );
      if (course.description) parts.push(`Description: ${course.description}`);
      if (course.units.length > 0) {
        parts.push("Units:");
        for (const unit of course.units) {
          const lessonList =
            unit.lessons.length > 0
              ? ` [Lessons: ${unit.lessons.map((l) => l.title).join(", ")}]`
              : "";
          parts.push(`  - ${unit.title}${lessonList}`);
        }
      }
    }
  }

  return parts.length > 0
    ? `\n\nCurrent context:\n${parts.join("\n")}`
    : "";
}

export async function POST(request: Request) {
  try {
    const anthropic = createAnthropicClient();
    const body = await request.json();
    const { message, courseId, unitId, lessonId, resourceId, chatId } = body;

    if (!message) {
      return Response.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get or create chat
    let chat;
    if (chatId) {
      chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!chat) {
        return Response.json({ error: "Chat not found" }, { status: 404 });
      }
    } else {
      chat = await prisma.chat.create({
        data: {
          ...(courseId && { courseId }),
          ...(unitId && { unitId }),
          ...(lessonId && { lessonId }),
          ...(resourceId && { resourceId }),
        },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "user",
        content: message,
      },
    });

    // Gather context from related entities
    const context = await gatherContext({
      courseId: courseId || chat.courseId || undefined,
      unitId: unitId || chat.unitId || undefined,
      lessonId: lessonId || chat.lessonId || undefined,
      resourceId: resourceId || chat.resourceId || undefined,
    });

    // Build message history for Claude
    const messageHistory: Anthropic.MessageParam[] = chat.messages.map(
      (msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })
    );
    messageHistory.push({ role: "user", content: message });

    // Call Claude API (anthropic client created above)
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT + context,
      messages: messageHistory,
    });

    const assistantContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save assistant response
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "assistant",
        content: assistantContent,
      },
    });

    return Response.json({
      chatId: chat.id,
      response: assistantContent,
    });
  } catch (error) {
    console.error("Failed to process chat:", error);
    return Response.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
