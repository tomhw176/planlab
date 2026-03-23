import { prisma } from "@/lib/db";
import { createAnthropicClient } from "@/lib/ai";

const SECTION_PROMPTS: Record<string, Record<string, string>> = {
  curriculumConnection: {
    align_curriculum:
      "Based on the lesson context and BC curriculum standards, suggest the Big Idea, Curricular Competency Focus, and Content Connection. Return as JSON: {\"bigIdea\": \"...\", \"competencyFocus\": \"...\", \"contentConnection\": \"...\"}",
    suggest_big_ideas:
      "Suggest relevant Big Ideas from the BC curriculum that connect to this lesson. Return as a brief paragraph.",
  },
  learningTarget: {
    write_target:
      "Write a clear, student-facing learning target for this lesson. Use 'I can...' or 'I will...' format. Keep it concise (1-2 sentences).",
    simplify_target:
      "Simplify the existing learning target to be more student-friendly. Use plain language appropriate for the grade level.",
  },
  lessonPurpose: {
    explain_connection:
      "Explain why this lesson exists in the context of the unit and course. How does it build on previous lessons and set up future ones? Keep it to 2-3 sentences.",
  },
  materialsNeeded: {
    generate_materials:
      "Generate a practical materials list for this lesson. Include both physical and digital materials. Return as a newline-separated list.",
  },
  hook: {
    debatable_question:
      "Create a debatable question that students would genuinely care about and that connects to this lesson's content. The question should have no single right answer and should spark discussion. Provide just the question and a brief teacher note about how to use it.",
    story_hook:
      "Create a compelling story or anecdote hook that draws students into the lesson topic. Keep it brief (2-3 sentences) and relevant to the learning objectives.",
    current_event_hook:
      "Suggest a current event or real-world connection that could open this lesson. Explain how to connect it to the lesson content.",
  },
  activities: {
    generate_activities:
      'Generate a sequence of activities for this lesson with timing. Return as JSON array: [{"name": "...", "duration": "X", "description": "..."}]. Ensure activities build toward the learning objectives and include varied engagement strategies.',
    add_tps:
      'Add a Think-Pair-Share activity to the lesson. Return as JSON: {"name": "Think-Pair-Share: [topic]", "duration": "10", "description": "..."}',
  },
  closure: {
    exit_ticket:
      "Create a brief exit ticket (1-3 questions) that checks understanding of the lesson's key objectives.",
    reflection_prompt:
      "Create a reflection prompt for students to complete at the end of the lesson.",
    three_two_one:
      "Create a 3-2-1 summary closure activity (3 things learned, 2 things found interesting, 1 question remaining).",
  },
  assessment: {
    quick_check:
      "Create 3-5 quick check questions that assess understanding of this lesson's content and skills.",
    formative_ideas:
      "Suggest 3-4 formative assessment strategies that could be used during or after this lesson.",
  },
  scaffolds: {
    scaffolding_strategies:
      "Suggest specific scaffolding strategies for students who may struggle with this lesson content. Include concrete examples.",
    sentence_starters:
      "Create sentence starters or frames that support students in expressing their understanding of the lesson content.",
  },
  extension: {
    challenge_questions:
      "Create 2-3 challenging extension questions for students who finish early or need more depth.",
    extension_activity:
      "Design an extension activity that deepens engagement with the lesson content for advanced learners.",
  },
  all: {
    full_plan:
      `Generate a complete lesson plan filling all sections. Return as JSON with these fields:
{
  "hook": "...",
  "learningTarget": "...",
  "lessonPurpose": "...",
  "materialsNeeded": "...",
  "activities": [{"name": "...", "duration": "X", "description": "..."}],
  "closure": "...",
  "assessment": "...",
  "scaffolds": "...",
  "extension": "...",
  "curriculumConnection": {"bigIdea": "...", "competencyFocus": "...", "contentConnection": "..."}
}
Make it practical, specific, and engaging. Align to BC curriculum standards where possible.`,
    review:
      "Review the current lesson plan and suggest specific improvements for each section. Be constructive and practical.",
    align:
      "Analyze how well this lesson aligns with BC curriculum standards. Suggest specific improvements to strengthen alignment.",
    timing:
      "Analyze the activity timing in this lesson. Suggest adjustments to ensure the lesson fits within the allotted duration. Be specific about which activities to shorten or extend.",
  },
};

async function gatherLessonContext(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      unit: {
        include: {
          course: true,
          lessons: { orderBy: { order: "asc" }, select: { title: true, status: true } },
        },
      },
      tags: true,
    },
  });

  if (!lesson) return { lesson: null, context: "" };

  const parts: string[] = [];

  if (lesson.unit?.course) {
    parts.push(
      `Course: "${lesson.unit.course.title}" (${lesson.unit.course.subject}, Grade ${lesson.unit.course.gradeLevel})`
    );
  }

  if (lesson.unit) {
    parts.push(`Unit: "${lesson.unit.title}"`);
    if (lesson.unit.bigIdea) parts.push(`Unit Big Idea: ${lesson.unit.bigIdea}`);
    const otherLessons = lesson.unit.lessons.filter((l) => l.title !== lesson.title);
    if (otherLessons.length > 0) {
      parts.push(`Other lessons in unit: ${otherLessons.map((l) => l.title).join(", ")}`);
    }
  }

  parts.push(`Lesson: "${lesson.title}"`);
  parts.push(`Duration: ${lesson.duration} minutes`);

  if (lesson.learningObjectives) parts.push(`Learning Objectives: ${lesson.learningObjectives}`);
  if (lesson.hook) parts.push(`Hook: ${lesson.hook}`);

  const cc = lesson.curriculumConnection as { bigIdea?: string; competencyFocus?: string; contentConnection?: string } | null;
  if (cc) {
    if (cc.bigIdea) parts.push(`Big Idea: ${cc.bigIdea}`);
    if (cc.competencyFocus) parts.push(`Competency Focus: ${cc.competencyFocus}`);
    if (cc.contentConnection) parts.push(`Content Connection: ${cc.contentConnection}`);
  }

  if (lesson.activities && JSON.stringify(lesson.activities) !== "[]") {
    parts.push(`Activities: ${JSON.stringify(lesson.activities)}`);
  }
  if (lesson.assessment) parts.push(`Assessment: ${lesson.assessment}`);
  if (lesson.closure) parts.push(`Closure: ${lesson.closure}`);

  // Fetch BC curriculum standards if course has grade level
  if (lesson.unit?.course?.gradeLevel) {
    const standards = await prisma.curriculumStandard.findMany({
      where: {
        subject: lesson.unit.course.subject,
        gradeLevel: lesson.unit.course.gradeLevel,
      },
      take: 20,
    });
    if (standards.length > 0) {
      parts.push("\nBC Curriculum Standards:");
      for (const std of standards) {
        parts.push(`  [${std.category}] ${std.description}`);
      }
    }
  }

  return { lesson, context: parts.join("\n") };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const anthropic = createAnthropicClient();
    const body = await request.json();
    const { section, action } = body;

    if (!section || !action) {
      return Response.json(
        { error: "section and action are required" },
        { status: 400 }
      );
    }

    const sectionPrompts = SECTION_PROMPTS[section];
    if (!sectionPrompts || !sectionPrompts[action]) {
      return Response.json(
        { error: `Unknown section/action: ${section}/${action}` },
        { status: 400 }
      );
    }

    const { lesson, context } = await gatherLessonContext(id);
    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    const systemPrompt = `You are a curriculum planning assistant helping a teacher build lesson plans. You specialize in BC (British Columbia) curriculum for Social Studies (Grades 6-12). Be practical, specific, and concise. When generating content, make it ready to use — not generic or placeholder-like.

Current lesson context:
${context}`;

    // anthropic client created above
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: sectionPrompts[action],
        },
      ],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ content });
  } catch (error) {
    console.error("Failed to generate:", error);
    return Response.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
