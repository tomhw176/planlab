import { prisma } from "@/lib/db";
import { getAuthedClient, isAuthenticated } from "@/lib/google-auth";
import { google } from "googleapis";

// EMU = English Metric Units (1 inch = 914400 EMU)
const EMU_PER_INCH = 914400;
const SLIDE_WIDTH = 10 * EMU_PER_INCH;
const SLIDE_HEIGHT = 5.625 * EMU_PER_INCH; // 16:9

function buildSlideRequests(
  slides: { title?: string; body?: string; notes?: string }[],
  presentationTitle: string
) {
  const requests: object[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideId = `slide_${i}`;
    const titleId = `title_${i}`;
    const bodyId = `body_${i}`;

    // Create the slide
    requests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: i,
        slideLayoutReference: { predefinedLayout: "BLANK" },
      },
    });

    // Title text box
    if (slide.title) {
      requests.push({
        createShape: {
          objectId: titleId,
          shapeType: "TEXT_BOX",
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 8.5 * EMU_PER_INCH, unit: "EMU" },
              height: { magnitude: 1 * EMU_PER_INCH, unit: "EMU" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 0.75 * EMU_PER_INCH,
              translateY: 0.4 * EMU_PER_INCH,
              unit: "EMU",
            },
          },
        },
      });

      requests.push({
        insertText: {
          objectId: titleId,
          insertionIndex: 0,
          text: slide.title,
        },
      });

      requests.push({
        updateTextStyle: {
          objectId: titleId,
          textRange: { type: "ALL" },
          style: {
            bold: true,
            fontSize: { magnitude: 28, unit: "PT" },
            foregroundColor: {
              opaqueColor: { rgbColor: { red: 0.15, green: 0.15, blue: 0.2 } },
            },
          },
          fields: "bold,fontSize,foregroundColor",
        },
      });
    }

    // Body text box
    if (slide.body) {
      requests.push({
        createShape: {
          objectId: bodyId,
          shapeType: "TEXT_BOX",
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 8.5 * EMU_PER_INCH, unit: "EMU" },
              height: { magnitude: 3.5 * EMU_PER_INCH, unit: "EMU" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 0.75 * EMU_PER_INCH,
              translateY: 1.6 * EMU_PER_INCH,
              unit: "EMU",
            },
          },
        },
      });

      requests.push({
        insertText: {
          objectId: bodyId,
          insertionIndex: 0,
          text: slide.body,
        },
      });

      requests.push({
        updateTextStyle: {
          objectId: bodyId,
          textRange: { type: "ALL" },
          style: {
            fontSize: { magnitude: 16, unit: "PT" },
            foregroundColor: {
              opaqueColor: { rgbColor: { red: 0.25, green: 0.25, blue: 0.3 } },
            },
          },
          fields: "fontSize,foregroundColor",
        },
      });
    }

  }

  return requests;
}

// ── Main Route Handler ──

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated()) {
    return Response.json({ error: "Not authenticated with Google", needsAuth: true }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const folderId = body.folderId as string | undefined;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { lesson: true },
    });

    if (!resource) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }

    if (resource.type !== "slides") {
      return Response.json({ error: "Resource is not a slide deck" }, { status: 400 });
    }

    const client = getAuthedClient();
    if (!client) {
      return Response.json({ error: "Google auth expired", needsAuth: true }, { status: 401 });
    }

    const slidesApi = google.slides({ version: "v1", auth: client });
    const drive = google.drive({ version: "v3", auth: client });

    const content = resource.content as Record<string, unknown>;
    const lessonTitle = resource.lesson?.title || "Lesson";
    const presTitle = `${resource.title} — ${lessonTitle}`;

    // Create blank presentation
    const createRes = await slidesApi.presentations.create({
      requestBody: { title: presTitle },
    });

    const presentationId = createRes.data.presentationId;
    if (!presentationId) {
      throw new Error("Failed to create Google Slides presentation");
    }

    // The new presentation has one blank slide by default — remove it
    const defaultSlides = createRes.data.slides || [];
    const deleteRequests: object[] = defaultSlides.map((s) => ({
      deleteObject: { objectId: s.objectId },
    }));

    const slides = (content.slides as { title?: string; body?: string; notes?: string }[]) || [];
    const slideRequests = buildSlideRequests(slides, presTitle);

    // Batch: delete default slide + add our slides
    const allRequests = [...deleteRequests, ...slideRequests];
    if (allRequests.length > 0) {
      await slidesApi.presentations.batchUpdate({
        presentationId,
        requestBody: { requests: allRequests },
      });
    }

    // Add speaker notes (requires fetching the presentation to get notes page object IDs)
    const hasNotes = slides.some((s) => s.notes);
    if (hasNotes) {
      try {
        const pres = await slidesApi.presentations.get({ presentationId });
        const createdSlides = pres.data.slides || [];
        const notesRequests: object[] = [];

        for (let i = 0; i < slides.length && i < createdSlides.length; i++) {
          if (!slides[i].notes) continue;
          const notesPage = createdSlides[i].slideProperties?.notesPage;
          // The notes page has a shape with a placeholder type BODY — that's where notes text goes
          const notesShape = notesPage?.pageElements?.find(
            (el) =>
              el.shape?.placeholder?.type === "BODY"
          );
          if (notesShape?.objectId) {
            notesRequests.push({
              insertText: {
                objectId: notesShape.objectId,
                insertionIndex: 0,
                text: slides[i].notes,
              },
            });
          }
        }

        if (notesRequests.length > 0) {
          await slidesApi.presentations.batchUpdate({
            presentationId,
            requestBody: { requests: notesRequests },
          });
        }
      } catch (notesErr) {
        console.error("Failed to add speaker notes:", notesErr);
        // Non-fatal — slides still created successfully
      }
    }

    // Move to selected folder
    if (folderId) {
      try {
        const file = await drive.files.get({
          fileId: presentationId,
          fields: "parents",
        });
        const previousParents = (file.data.parents || []).join(",");
        await drive.files.update({
          fileId: presentationId,
          addParents: folderId,
          removeParents: previousParents,
          fields: "id, parents",
        });
      } catch (moveErr) {
        console.error("Failed to move presentation to folder:", moveErr);
      }
    }

    const presUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

    return Response.json({
      success: true,
      presentationId,
      url: presUrl,
      title: presTitle,
    });
  } catch (error) {
    console.error("Google Slides export error:", error);
    return Response.json({ error: "Failed to create Google Slides presentation" }, { status: 500 });
  }
}
