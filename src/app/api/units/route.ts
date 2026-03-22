import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      bigIdea,
      courseId,
      status,
      monthStart,
      weekStart,
      monthEnd,
      weekEnd,
    } = body;

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    // Determine the next order value within the course
    let order = 0;
    if (courseId) {
      const lastUnit = await prisma.unit.findFirst({
        where: { courseId },
        orderBy: { order: "desc" },
      });
      order = lastUnit ? lastUnit.order + 1 : 0;
    }

    const unit = await prisma.unit.create({
      data: {
        title,
        description,
        bigIdea,
        order,
        status,
        monthStart,
        weekStart,
        monthEnd,
        weekEnd,
        ...(courseId && { courseId }),
      },
    });

    return Response.json(unit, { status: 201 });
  } catch (error) {
    console.error("Failed to create unit:", error);
    return Response.json(
      { error: "Failed to create unit" },
      { status: 500 }
    );
  }
}
