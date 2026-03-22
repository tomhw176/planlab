import { prisma } from "@/lib/db";

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
