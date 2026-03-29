import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

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

// GET /api/lessons — list all lessons (for linking UI)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const lessons = await prisma.lesson.findMany({
    where: q
      ? { title: { contains: q, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      unit: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(lessons);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      unitId,
      templateId,
      creationMode,
      duration,
      status,
      hook,
      learningObjectives,
      learningTarget,
      lessonPurpose,
      curriculumConnection,
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

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    // Determine the next order value within the unit
    let order = 0;
    if (unitId) {
      const lastLesson = await prisma.lesson.findFirst({
        where: { unitId },
        orderBy: { order: "desc" },
      });
      order = lastLesson ? lastLesson.order + 1 : 0;
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        order,
        templateId,
        creationMode,
        ...(duration && { duration }),
        status,
        hook: toStr(hook) ?? "",
        learningObjectives: toStr(learningObjectives) ?? "",
        learningTarget: toStr(learningTarget) ?? "",
        lessonPurpose: toStr(lessonPurpose) ?? "",
        curriculumConnection,
        keyVocabulary: toStr(keyVocabulary) ?? "",
        transferableConcepts: toStr(transferableConcepts) ?? "",
        activities,
        materialsNeeded: toStr(materialsNeeded) ?? "",
        differentiation: toStr(differentiation) ?? "",
        assessment: toStr(assessment) ?? "",
        scaffolds: toStr(scaffolds) ?? "",
        extension: toStr(extension) ?? "",
        closure: toStr(closure) ?? "",
        notes: toStr(notes) ?? "",
        ...(unitId && { unitId }),
      },
    });

    return Response.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Failed to create lesson:", error);
    return Response.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
