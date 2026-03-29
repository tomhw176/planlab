import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

interface TemplateStructure {
  defaultSliders?: {
    prepDemand: number;
    teacherDirection: number;
    collaboration: number;
    assessmentEvidence: number;
    managementComplexity: number;
  };
  bestUseCases?: string[];
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { topic, grade, duration, students, classCharacteristics, learningObjective, purposeNotes, sliders, constraints } = body;

    const templates = await prisma.lessonTemplate.findMany({
      select: { id: true, name: true, description: true, structure: true },
      orderBy: { createdAt: "asc" },
    });

    if (templates.length === 0) {
      return Response.json({ recommendations: [] });
    }

    // Build template summaries for the prompt
    const templateSummaries = templates.map((t, i) => {
      const s = t.structure as TemplateStructure;
      const sliderDesc = s.defaultSliders
        ? `Prep=${s.defaultSliders.prepDemand}, Direction=${s.defaultSliders.teacherDirection}(1=student-led,5=teacher-led), Collab=${s.defaultSliders.collaboration}, Evidence=${s.defaultSliders.assessmentEvidence}, Mgmt=${s.defaultSliders.managementComplexity}`
        : "default";
      const useCases = s.bestUseCases?.join("; ") || "";
      return `${i + 1}. "${t.name}" — ${t.description}. Best for: ${useCases}. Profile: ${sliderDesc}.`;
    }).join("\n");

    // Build context from user inputs
    const contextParts: string[] = [];
    if (topic) contextParts.push(`Topic: ${topic}`);
    if (grade) contextParts.push(`Grade: ${grade}`);
    if (duration) contextParts.push(`Duration: ${duration} min`);
    if (students) contextParts.push(`Students: ${students}`);
    if (learningObjective) contextParts.push(`Learning Objective: ${learningObjective}`);
    if (classCharacteristics) contextParts.push(`Class Characteristics: ${classCharacteristics}`);
    if (purposeNotes) contextParts.push(`Teacher Notes: ${purposeNotes}`);

    if (sliders) {
      const labels: Record<string, [string, string]> = {
        prepDemand: ["Prep Demand", "low/high"],
        teacherDirection: ["Teacher Direction", "student-led/teacher-led"],
        collaboration: ["Collaboration", "individual/collaborative"],
        assessmentEvidence: ["Assessment Evidence", "low/high"],
        managementComplexity: ["Management Complexity", "simple/complex"],
      };
      const parts = Object.entries(labels).map(([key, [label, scale]]) => {
        const val = sliders[key];
        return `${label}: ${val}/5 (${scale})`;
      });
      contextParts.push(`Preferred style: ${parts.join(", ")}`);
    }

    if (constraints) {
      const active: string[] = [];
      if (constraints.noTechRequired) active.push("no teacher tech");
      if (constraints.chromebooksAvailable) active.push("1-to-1 Chromebooks");
      if (constraints.phonesAvailable) active.push("student phones/tablets");
      if (active.length > 0) contextParts.push(`Constraints: ${active.join(", ")}`);
    }

    const prompt = `Given this lesson context:
${contextParts.join("\n")}

Available lesson templates:
${templateSummaries}

Recommend the top 3 templates that best fit this lesson. For each, give the template name (exactly as listed) and a 1-sentence reason why it's a good fit for this specific lesson.

Return ONLY a JSON array:
[{"templateName": "exact name", "reason": "1 sentence"}, ...]`;

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "";

    try {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const parsed = JSON.parse(arrayMatch[0]) as Array<{ templateName: string; reason: string }>;

        // Map template names to IDs
        const recommendations = parsed
          .map((rec) => {
            const template = templates.find((t) => t.name === rec.templateName);
            if (!template) return null;
            return { templateId: template.id, templateName: rec.templateName, reason: rec.reason };
          })
          .filter(Boolean)
          .slice(0, 3);

        return Response.json({ recommendations });
      }
    } catch { /* parse error */ }

    return Response.json({ recommendations: [] });
  } catch (error) {
    console.error("Failed to recommend templates:", error);
    return Response.json({ error: "Failed to recommend templates" }, { status: 500 });
  }
}
