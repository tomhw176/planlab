import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get("subject");
    const gradeLevel = searchParams.get("gradeLevel");

    if (!subject || !gradeLevel) {
      return Response.json(
        { error: "subject and gradeLevel query parameters are required" },
        { status: 400 }
      );
    }

    const standards = await prisma.curriculumStandard.findMany({
      where: {
        subject,
        gradeLevel,
      },
      orderBy: [{ category: "asc" }, { code: "asc" }],
    });

    return Response.json(standards);
  } catch (error) {
    console.error("Failed to fetch curriculum standards:", error);
    return Response.json(
      { error: "Failed to fetch curriculum standards" },
      { status: 500 }
    );
  }
}
