import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { createAnthropicClient } from "@/lib/ai";
import { getResourcePrompts } from "@/lib/resource-prompts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const anthropic = createAnthropicClient();
    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        unit: { include: { course: true } },
        resources: true,
      },
    });

    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Parse request body for selected resource titles
    let selectedTitles: string[] | undefined;
    try {
      const body = await request.json();
      if (body.selectedTitles && Array.isArray(body.selectedTitles)) {
        selectedTitles = body.selectedTitles;
      }
    } catch {
      // No body or invalid JSON — generate all
    }

    // Determine template name
    let templateName = "";
    if (lesson.templateId) {
      const template = await prisma.lessonTemplate.findUnique({
        where: { id: lesson.templateId },
        select: { name: true },
      });
      templateName = template?.name || "";
    }

    // Build lesson data for prompts
    const activities = Array.isArray(lesson.activities)
      ? (lesson.activities as Array<{ name: string; duration: string; description: string }>)
      : [];

    const cc = (lesson.curriculumConnection || {}) as {
      bigIdea?: string;
      competencyFocus?: string;
      contentConnection?: string;
    };

    const lessonData = {
      title: lesson.title,
      hook: lesson.hook,
      learningTarget: lesson.learningTarget,
      lessonPurpose: lesson.lessonPurpose,
      materialsNeeded: lesson.materialsNeeded,
      activities,
      closure: lesson.closure,
      assessment: lesson.assessment,
      scaffolds: lesson.scaffolds,
      extension: lesson.extension,
      notes: lesson.notes,
      curriculumConnection: {
        bigIdea: cc.bigIdea || "",
        competencyFocus: cc.competencyFocus || "",
        contentConnection: cc.contentConnection || "",
      },
      unit: lesson.unit
        ? {
            title: lesson.unit.title,
            course: lesson.unit.course
              ? {
                  title: lesson.unit.course.title,
                  gradeLevel: lesson.unit.course.gradeLevel,
                }
              : undefined,
          }
        : null,
    };

    const prompts = getResourcePrompts(lessonData, templateName, selectedTitles);

    if (prompts.length === 0) {
      return Response.json(
        { error: "No resources defined for this template" },
        { status: 400 }
      );
    }

    // anthropic client created above

    const systemPrompt = `You are an expert curriculum resource designer creating classroom-ready materials for teachers. Generate polished, professional, historically accurate resources that are ready to print and use. Always return valid JSON.`;

    // Stream results as each resource completes
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Send initial event with total count
        sendEvent({ type: "started", total: prompts.length });

        // Fire all AI calls in parallel
        const results = await Promise.allSettled(
          prompts.map(async (prompt) => {
            try {
              const response = await anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: "user", content: prompt.userPrompt }],
              });

              const content =
                response.content[0].type === "text"
                  ? response.content[0].text
                  : "";

              const parsedContent = prompt.parseResponse(content);

              // Save to database
              const resource = await prisma.resource.create({
                data: {
                  title: prompt.title,
                  type: prompt.type,
                  content: parsedContent as Prisma.InputJsonValue,
                  status: "draft",
                  lessonId: id,
                },
              });

              sendEvent({
                type: "resource_complete",
                resource: {
                  id: resource.id,
                  title: resource.title,
                  type: resource.type,
                },
              });

              return resource;
            } catch (err) {
              sendEvent({
                type: "resource_error",
                resourceType: prompt.type,
                resourceTitle: prompt.title,
                error: err instanceof Error ? err.message : String(err),
              });
              throw err;
            }
          })
        );

        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        sendEvent({
          type: "done",
          succeeded,
          total: prompts.length,
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to generate resources:", error);
    return Response.json(
      { error: "Failed to generate resources" },
      { status: 500 }
    );
  }
}
