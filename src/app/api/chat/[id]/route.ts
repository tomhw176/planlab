import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        course: true,
        unit: true,
        lesson: true,
        resource: true,
      },
    });

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json(chat);
  } catch (error) {
    console.error("Failed to fetch chat:", error);
    return Response.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}
