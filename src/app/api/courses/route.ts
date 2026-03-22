import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { units: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return Response.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subject, gradeLevel, description, color } = body;

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title,
        subject,
        gradeLevel,
        description,
        color,
      },
    });

    return Response.json(course, { status: 201 });
  } catch (error) {
    console.error("Failed to create course:", error);
    return Response.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
