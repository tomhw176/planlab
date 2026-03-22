import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.lessonTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json(templates);
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return Response.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, structure } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const template = await prisma.lessonTemplate.create({
      data: {
        name,
        description,
        structure,
      },
    });

    return Response.json(template, { status: 201 });
  } catch (error) {
    console.error("Failed to create template:", error);
    return Response.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
