import { prisma } from "@/lib/db";
import { getResourceOptions } from "@/lib/resource-prompts";

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
        ...(hook !== undefined && { hook }),
        ...(learningObjectives !== undefined && { learningObjectives }),
        ...(curriculumConnection !== undefined && { curriculumConnection }),
        ...(learningTarget !== undefined && { learningTarget }),
        ...(lessonPurpose !== undefined && { lessonPurpose }),
        ...(keyVocabulary !== undefined && { keyVocabulary }),
        ...(transferableConcepts !== undefined && { transferableConcepts }),
        ...(activities !== undefined && { activities }),
        ...(materialsNeeded !== undefined && { materialsNeeded }),
        ...(differentiation !== undefined && { differentiation }),
        ...(assessment !== undefined && { assessment }),
        ...(scaffolds !== undefined && { scaffolds }),
        ...(extension !== undefined && { extension }),
        ...(closure !== undefined && { closure }),
        ...(notes !== undefined && { notes }),
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
