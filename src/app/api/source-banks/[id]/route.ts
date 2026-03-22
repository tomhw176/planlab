import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/source-banks/[id] — get source bank with all sources
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bank = await prisma.sourceBank.findUnique({
    where: { id },
    include: {
      lesson: { select: { id: true, title: true } },
      sources: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!bank) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(bank);
}

// PATCH /api/source-banks/[id] — update (link/unlink lesson)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if ("lessonId" in body) {
    updateData.lessonId = body.lessonId || null;
  }

  const bank = await prisma.sourceBank.update({
    where: { id },
    data: updateData,
    include: {
      lesson: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(bank);
}

// DELETE /api/source-banks/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.sourceBank.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
