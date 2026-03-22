import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { unitId, lessonIds } = body as {
      unitId: string;
      lessonIds: string[];
    };

    if (!unitId || !lessonIds || !Array.isArray(lessonIds)) {
      return Response.json(
        { error: "unitId and lessonIds array are required" },
        { status: 400 }
      );
    }

    // Update each lesson's order in a transaction
    await prisma.$transaction(
      lessonIds.map((lessonId, index) =>
        prisma.lesson.update({
          where: { id: lessonId },
          data: { order: index },
        })
      )
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder lessons:", error);
    return Response.json(
      { error: "Failed to reorder lessons" },
      { status: 500 }
    );
  }
}
