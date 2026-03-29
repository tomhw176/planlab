import { prisma } from "@/lib/db";
import { getResourceOptions } from "@/lib/resource-prompts";

// Ensure a value is a plain string — if AI returned an object, convert to readable text
function toStr(val: unknown): string | undefined {
  if (val === undefined) return undefined;
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return objectToText(val as Record<string, unknown>);
  }
  return String(val);
}

function objectToText(obj: Record<string, unknown>, indent = ""): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value == null || value === "") continue;
    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
    if (typeof value === "string") {
      parts.push(`${indent}${label}: ${value}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) continue;
      parts.push(`${indent}${label}:`);
      for (const item of value) {
        if (typeof item === "string") {
          parts.push(`${indent}  • ${item}`);
        } else if (typeof item === "object" && item) {
          parts.push(objectToText(item as Record<string, unknown>, indent + "  "));
          parts.push("");
        }
      }
    } else if (typeof value === "object") {
      parts.push(`${indent}${label}:`);
      parts.push(objectToText(value as Record<string, unknown>, indent + "  "));
    } else {
      parts.push(`${indent}${label}: ${String(value)}`);
    }
  }
  return parts.join("\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        resources: true,
        unit: {
          include: {
            course: true,
          },
        },
        tags: true,
      },
    });

    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Include available resource options
    let templateName = "";
    if (lesson.templateId) {
      const template = await prisma.lessonTemplate.findUnique({
        where: { id: lesson.templateId },
        select: { name: true },
      });
      templateName = template?.name || "";
    }
    const resourceOptions = getResourceOptions(templateName);

    return Response.json({ ...lesson, resourceOptions });
  } catch (error) {
    console.error("Failed to fetch lesson:", error);
    return Response.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const {
      title,
      order,
      status,
      unitId,
      templateId,
      creationMode,
      duration,
      hook,
      learningObjectives,
      curriculumConnection,
      learningTarget,
      lessonPurpose,
      keyVocabulary,
      transferableConcepts,
      activities,
      materialsNeeded,
      differentiation,
      assessment,
      scaffolds,
      extension,
      closure,
      notes,
    } = body;

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order }),
        ...(status !== undefined && { status }),
        ...(unitId !== undefined && { unitId }),
        ...(templateId !== undefined && { templateId }),
        ...(creationMode !== undefined && { creationMode }),
        ...(duration !== undefined && { duration }),
        ...(hook !== undefined && { hook: toStr(hook) }),
        ...(learningObjectives !== undefined && { learningObjectives: toStr(learningObjectives) }),
        ...(curriculumConnection !== undefined && { curriculumConnection }),
        ...(learningTarget !== undefined && { learningTarget: toStr(learningTarget) }),
        ...(lessonPurpose !== undefined && { lessonPurpose: toStr(lessonPurpose) }),
        ...(keyVocabulary !== undefined && { keyVocabulary: toStr(keyVocabulary) }),
        ...(transferableConcepts !== undefined && { transferableConcepts: toStr(transferableConcepts) }),
        ...(activities !== undefined && { activities }),
        ...(materialsNeeded !== undefined && { materialsNeeded: toStr(materialsNeeded) }),
        ...(differentiation !== undefined && { differentiation: toStr(differentiation) }),
        ...(assessment !== undefined && { assessment: toStr(assessment) }),
        ...(scaffolds !== undefined && { scaffolds: toStr(scaffolds) }),
        ...(extension !== undefined && { extension: toStr(extension) }),
        ...(closure !== undefined && { closure: toStr(closure) }),
        ...(notes !== undefined && { notes: toStr(notes) }),
      },
    });

    return Response.json(lesson);
  } catch (error) {
    console.error("Failed to update lesson:", error);
    return Response.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.lesson.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lesson:", error);
    return Response.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
