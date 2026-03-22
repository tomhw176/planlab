import { prisma } from "@/lib/db";
import { getAuthedClient, isAuthenticated } from "@/lib/google-auth";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Not authenticated with Google" }, { status: 401 });
  }

  const auth = getAuthedClient();
  if (!auth) {
    return NextResponse.json({ error: "Failed to get Google auth" }, { status: 401 });
  }

  const bank = await prisma.sourceBank.findUnique({
    where: { id },
    include: {
      sources: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!bank) {
    return NextResponse.json({ error: "Source bank not found" }, { status: 404 });
  }

  const { folderId } = await req.json().catch(() => ({ folderId: undefined }));

  const recommended = bank.sources
    .filter((s) => s.isRecommended)
    .sort((a, b) => (a.sequenceOrder ?? 99) - (b.sequenceOrder ?? 99));

  if (recommended.length === 0) {
    return NextResponse.json({ error: "No recommended sources to export" }, { status: 400 });
  }

  try {
    const docs = google.docs({ version: "v1", auth });
    const drive = google.drive({ version: "v3", auth });

    // Create the document
    const title = `Source Packet: ${bank.topic}`;
    const doc = await docs.documents.create({
      requestBody: { title },
    });
    const docId = doc.data.documentId!;

    // Build content
    const textParts: { text: string; bold?: boolean; italic?: boolean; fontSize?: number; heading?: string }[] = [];

    // Title
    textParts.push({ text: `Source Packet: ${bank.topic}\n`, bold: true, fontSize: 18 });

    if (bank.inquiryQuestion) {
      textParts.push({ text: `Inquiry Question: ${bank.inquiryQuestion}\n\n`, italic: true, fontSize: 12 });
    } else {
      textParts.push({ text: "\n" });
    }

    textParts.push({ text: "─".repeat(60) + "\n\n" });

    // Each recommended source
    for (let i = 0; i < recommended.length; i++) {
      const s = recommended[i];
      textParts.push({
        text: `Source ${i + 1}: ${s.title}\n`,
        bold: true,
        fontSize: 14,
      });

      if (s.creator || s.dateCreated) {
        const meta = [s.creator, s.dateCreated].filter(Boolean).join(", ");
        textParts.push({ text: meta + "\n", italic: true });
      }

      textParts.push({ text: "\n" });

      // Summary
      if (s.summary) {
        textParts.push({ text: "About This Source: ", bold: true });
        textParts.push({ text: s.summary + "\n\n" });
      }

      // Significance
      if (s.significance) {
        textParts.push({ text: "Why It Matters: ", bold: true });
        textParts.push({ text: s.significance + "\n\n" });
      }

      // Vocabulary barriers
      if (s.vocabularyBarriers) {
        textParts.push({ text: "Key Vocabulary: ", bold: true });
        textParts.push({ text: s.vocabularyBarriers + "\n\n" });
      }

      // Historical thinking
      if (s.historicalThinkingMove) {
        textParts.push({ text: "Historical Thinking Skill: ", bold: true });
        textParts.push({ text: s.historicalThinkingMove + "\n\n" });
      }

      // Guiding questions for students
      textParts.push({ text: "As you read, consider:\n", bold: true });
      textParts.push({ text: `• What claims or evidence does this source provide?\n` });
      textParts.push({ text: `• What perspective does the creator represent?\n` });
      textParts.push({ text: `• What might be missing or biased?\n\n` });

      // Link
      if (s.link && s.link !== "No direct link available") {
        textParts.push({ text: "Source: ", bold: true });
        textParts.push({ text: s.link + "\n" });
      }

      // Citation
      if (s.bibliographicInfo) {
        textParts.push({ text: "Citation: ", bold: true });
        textParts.push({ text: s.bibliographicInfo + "\n" });
      }

      textParts.push({ text: "\n" + "─".repeat(60) + "\n\n" });
    }

    // Insert all text
    const fullText = textParts.map((p) => p.text).join("");
    const requests: object[] = [
      { insertText: { location: { index: 1 }, text: fullText } },
    ];

    // Apply formatting
    let offset = 1;
    for (const part of textParts) {
      const len = part.text.length;
      if (part.bold || part.italic || part.fontSize) {
        const style: Record<string, unknown> = {};
        const fields: string[] = [];
        if (part.bold) { style.bold = true; fields.push("bold"); }
        if (part.italic) { style.italic = true; fields.push("italic"); }
        if (part.fontSize) {
          style.fontSize = { magnitude: part.fontSize, unit: "PT" };
          fields.push("fontSize");
        }
        requests.push({
          updateTextStyle: {
            range: { startIndex: offset, endIndex: offset + len },
            textStyle: style,
            fields: fields.join(","),
          },
        });
      }
      offset += len;
    }

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });

    // Move to folder if specified
    if (folderId) {
      await drive.files.update({
        fileId: docId,
        addParents: folderId,
        fields: "id, parents",
      });
    }

    return NextResponse.json({
      success: true,
      documentId: docId,
      url: `https://docs.google.com/document/d/${docId}/edit`,
      title,
    });
  } catch (error) {
    console.error("Source bank doc export error:", error);
    return NextResponse.json(
      { error: "Failed to create Google Doc" },
      { status: 500 }
    );
  }
}
