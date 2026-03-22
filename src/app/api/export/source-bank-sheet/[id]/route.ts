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

  const allSources = bank.sources.sort((a, b) => {
    // Recommended first, then by sequence order
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return (a.sequenceOrder ?? 99) - (b.sequenceOrder ?? 99);
  });

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const drive = google.drive({ version: "v3", auth });

    const title = `Source Curation: ${bank.topic}`;

    // Create spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [
          {
            properties: {
              title: "Source Curation Table",
              gridProperties: { frozenRowCount: 1 },
            },
          },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;
    const sheetId = spreadsheet.data.sheets![0].properties!.sheetId!;

    // Build header row
    const headers = [
      "#",
      "Recommended",
      "Seq",
      "Title",
      "Source Type",
      "Creator",
      "Date",
      "Perspective Role",
      "Confidence",
      "Relevance",
      "Readability",
      "Excerptability",
      "Hist. Thinking",
      "Uniqueness",
      "Overall",
      "Summary",
      "Significance",
      "Claims / Evidence",
      "Historical Thinking Move",
      "Length",
      "Excerpt Options",
      "Vocabulary Barriers",
      "Link",
      "Citation",
      "Flags",
    ];

    // Build data rows
    const rows = allSources.map((s, i) => [
      i + 1,
      s.isRecommended ? "✓" : "",
      s.sequenceOrder ?? "",
      s.title,
      s.sourceType,
      s.creator,
      s.dateCreated,
      s.perspectiveRole,
      s.confidenceLevel,
      s.relevanceScore,
      s.readabilityScore,
      s.excerptabilityScore,
      s.historicalThinkingScore,
      s.uniquenessScore,
      s.overallScore,
      s.summary,
      s.significance,
      s.claimsEvidence,
      s.historicalThinkingMove,
      s.lengthDescription,
      s.excerptOptions,
      s.vocabularyBarriers,
      s.link,
      s.bibliographicInfo,
      s.flags,
    ]);

    // Write data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Source Curation Table!A1",
      valueInputOption: "RAW",
      requestBody: {
        values: [headers, ...rows],
      },
    });

    // Format the spreadsheet
    const formatRequests: object[] = [
      // Bold header row
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 } },
              backgroundColor: { red: 0.2, green: 0.4, blue: 0.7 },
            },
          },
          fields: "userEnteredFormat(textFormat,backgroundColor)",
        },
      },
      // Auto-resize columns
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: 0,
            endIndex: 15,
          },
        },
      },
      // Highlight recommended rows
      ...allSources
        .filter((s) => s.isRecommended)
        .map((s) => {
          const i = allSources.indexOf(s);
          return {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: i + 1,
                endRowIndex: i + 2,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.93, green: 0.97, blue: 0.93 },
                },
              },
              fields: "userEnteredFormat.backgroundColor",
            },
          };
        }),
      // Color confidence levels
      ...allSources
        .map((s, i) => {
          const color =
            s.confidenceLevel === "high"
              ? { red: 0.2, green: 0.65, blue: 0.33 }
              : s.confidenceLevel === "low"
              ? { red: 0.85, green: 0.2, blue: 0.2 }
              : { red: 0.85, green: 0.65, blue: 0.13 };
          return {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: i + 1,
                endRowIndex: i + 2,
                startColumnIndex: 8,
                endColumnIndex: 9,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    foregroundColor: color,
                    bold: true,
                  },
                },
              },
              fields: "userEnteredFormat.textFormat",
            },
          };
        }),
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: formatRequests },
    });

    // Move to folder if specified
    if (folderId) {
      await drive.files.update({
        fileId: spreadsheetId,
        addParents: folderId,
        fields: "id, parents",
      });
    }

    return NextResponse.json({
      success: true,
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      title,
    });
  } catch (error) {
    console.error("Source bank sheet export error:", error);
    return NextResponse.json(
      { error: "Failed to create Google Sheet" },
      { status: 500 }
    );
  }
}
