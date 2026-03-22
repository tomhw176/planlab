import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!course) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    return Response.json(course);
  } catch (error) {
    console.error("Failed to fetch course:", error);
    return Response.json(
      { error: "Failed to fetch course" },
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
    const { title, subject, gradeLevel, description, color, courseDefaults } = body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subject !== undefined && { subject }),
        ...(gradeLevel !== undefined && { gradeLevel }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(courseDefaults !== undefined && { courseDefaults }),
      },
    });

    return Response.json(course);
  } catch (error) {
    console.error("Failed to update course:", error);
    return Response.json(
      { error: "Failed to update course" },
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
    await prisma.course.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return Response.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
