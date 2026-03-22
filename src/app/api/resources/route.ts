import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, content, status, lessonId, unitId } = body;

    if (!title || !type) {
      return Response.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    if (!lessonId) {
      return Response.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        type,
        content,
        status,
        lessonId,
        unitId,
      },
    });

    return Response.json(resource, { status: 201 });
  } catch (error) {
    console.error("Failed to create resource:", error);
    return Response.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
