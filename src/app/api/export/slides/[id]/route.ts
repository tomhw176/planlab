import { prisma } from "@/lib/db";
import PptxGenJS from "pptxgenjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            unit: { include: { course: true } },
          },
        },
      },
    });

    if (!resource) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }

    const pptx = new PptxGenJS();
    pptx.author = "PlanLab";
    pptx.title = resource.title;

    const content = resource.content as Record<string, unknown>;
    const slides = (content.slides as { title?: string; body?: string; notes?: string }[]) || [];

    if (slides.length === 0) {
      // Create a title slide from the resource info
      const titleSlide = pptx.addSlide();
      titleSlide.addText(resource.title, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 1.5,
        fontSize: 36,
        bold: true,
        color: "363636",
        align: "center",
      });

      if (resource.lesson) {
        titleSlide.addText(resource.lesson.title, {
          x: 0.5,
          y: 3.2,
          w: 9,
          h: 0.8,
          fontSize: 18,
          color: "666666",
          align: "center",
        });
      }
    } else {
      for (const slideData of slides) {
        const slide = pptx.addSlide();

        if (slideData.title) {
          slide.addText(slideData.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 1,
            fontSize: 28,
            bold: true,
            color: "363636",
          });
        }

        if (slideData.body) {
          slide.addText(slideData.body, {
            x: 0.5,
            y: 1.8,
            w: 9,
            h: 4,
            fontSize: 16,
            color: "444444",
            valign: "top",
          });
        }

        if (slideData.notes) {
          slide.addNotes(slideData.notes);
        }
      }
    }

    const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;

    const filename = `${resource.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.pptx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}
