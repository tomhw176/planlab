import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
        course: true,
        tags: true,
      },
    });

    if (!unit) {
      return Response.json({ error: "Unit not found" }, { status: 404 });
    }

    return Response.json(unit);
  } catch (error) {
    console.error("Failed to fetch unit:", error);
    return Response.json({ error: "Failed to fetch unit" }, { status: 500 });
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
      description,
      bigIdea,
      order,
      status,
      courseId,
      monthStart,
      weekStart,
      monthEnd,
      weekEnd,
    } = body;

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(bigIdea !== undefined && { bigIdea }),
        ...(order !== undefined && { order }),
        ...(status !== undefined && { status }),
        ...(courseId !== undefined && { courseId }),
        ...(monthStart !== undefined && { monthStart }),
        ...(weekStart !== undefined && { weekStart }),
        ...(monthEnd !== undefined && { monthEnd }),
        ...(weekEnd !== undefined && { weekEnd }),
      },
    });

    return Response.json(unit);
  } catch (error) {
    console.error("Failed to update unit:", error);
    return Response.json(
      { error: "Failed to update unit" },
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
    await prisma.unit.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete unit:", error);
    return Response.json(
      { error: "Failed to delete unit" },
      { status: 500 }
    );
  }
}
