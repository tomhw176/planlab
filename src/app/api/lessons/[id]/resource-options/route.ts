import { prisma } from "@/lib/db";
import { getResourceOptions } from "@/lib/resource-prompts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { templateId: true },
    });

    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    let templateName = "";
    if (lesson.templateId) {
      const template = await prisma.lessonTemplate.findUnique({
        where: { id: lesson.templateId },
        select: { name: true },
      });
      templateName = template?.name || "";
    }

    const options = getResourceOptions(templateName);

    return Response.json({ options, templateName });
  } catch (error) {
    console.error("Failed to get resource options:", error);
    return Response.json({ error: "Failed to get resource options" }, { status: 500 });
  }
}
