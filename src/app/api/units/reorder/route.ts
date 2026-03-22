import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { courseId, unitIds } = body as {
      courseId: string;
      unitIds: string[];
    };

    if (!courseId || !unitIds || !Array.isArray(unitIds)) {
      return Response.json(
        { error: "courseId and unitIds array are required" },
        { status: 400 }
      );
    }

    // Update each unit's order in a transaction
    await prisma.$transaction(
      unitIds.map((unitId, index) =>
        prisma.unit.update({
          where: { id: unitId },
          data: { order: index },
        })
      )
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder units:", error);
    return Response.json(
      { error: "Failed to reorder units" },
      { status: 500 }
    );
  }
}
