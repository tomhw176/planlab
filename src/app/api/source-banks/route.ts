import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/source-banks — list all source banks
export async function GET() {
  const banks = await prisma.sourceBank.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lesson: { select: { id: true, title: true } },
      _count: { select: { sources: true } },
    },
  });
  return NextResponse.json(banks);
}

// POST /api/source-banks — create a new source bank
export async function POST(req: Request) {
  const body = await req.json();
  const bank = await prisma.sourceBank.create({
    data: {
      topic: body.topic,
      grade: body.grade || "",
      inquiryQuestion: body.inquiryQuestion || "",
      perspectives: body.perspectives || [],
      historicalThinkingSkills: body.historicalThinkingSkills || "",
      numSourcesRequested: body.numSourcesRequested || 6,
      notes: body.notes || "",
      status: "pending",
      lessonId: body.lessonId || null,
    },
  });
  return NextResponse.json(bank);
}
