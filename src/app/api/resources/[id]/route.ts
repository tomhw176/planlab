import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        lesson: true,
      },
    });

    if (!resource) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }

    return Response.json(resource);
  } catch (error) {
    console.error("Failed to fetch resource:", error);
    return Response.json(
      { error: "Failed to fetch resource" },
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
    const { title, type, content, status, lessonId, unitId } = body;

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
        ...(lessonId !== undefined && { lessonId }),
        ...(unitId !== undefined && { unitId }),
      },
    });

    return Response.json(resource);
  } catch (error) {
    console.error("Failed to update resource:", error);
    return Response.json(
      { error: "Failed to update resource" },
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
    await prisma.resource.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete resource:", error);
    return Response.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
