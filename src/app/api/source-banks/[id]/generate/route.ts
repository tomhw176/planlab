import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const bank = await prisma.sourceBank.findUnique({ where: { id } });
  if (!bank) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Mark as generating
  await prisma.sourceBank.update({
    where: { id },
    data: { status: "generating" },
  });

  const perspectives = Array.isArray(bank.perspectives) ? (bank.perspectives as string[]).join(", ") : "";

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: `You are a historical source curator for middle/high school inquiry lessons. Your task is to build a candidate source bank for a lesson.

## Context
- Topic: ${bank.topic}
- Grade: ${bank.grade || "Not specified — assume middle/high school"}
- Inquiry Question: ${bank.inquiryQuestion || "Not specified — choose the best one for this topic"}
- Required Perspectives: ${perspectives || "A diversity of perspectives"}
- Historical Thinking Skills: ${bank.historicalThinkingSkills || "Not specified"}
- Number of Final Sources Needed: ${bank.numSourcesRequested}
- Additional Notes: ${bank.notes || "None"}

## Instructions

1. Find 15–20 candidate sources. NEVER invent sources, bibliographic data, or links. Only recommend sources you are confident actually exist.

2. Prioritize:
   a. Trustworthy online sources: archives, museums, libraries, universities, reputable public history sources
   b. Sources used in reputable existing lesson plans (Digital Inquiry Group, Facing History, OER Project, Stanford History Education Group, etc.)
   c. A diversity of source types: political cartoons, maps, images, primary written sources, secondary sources, data/statistics
   d. A diversity of perspectives as specified
   e. Short, excerptable sources — avoid sources that are too hard, long, or context-dependent
   f. Sources that support historical thinking, not just fact extraction

3. For each source, assess your CONFIDENCE LEVEL:
   - "high" = You are very confident this source exists, is accessible online, and the link is correct
   - "medium" = You believe this source exists but are not 100% certain about the exact URL or availability
   - "low" = You think this type of source exists but cannot verify specific details

4. Score each source (1-5) on: relevance, readability, excerptability, historical thinking value, uniqueness of perspective.

5. Recommend the best final set of ${bank.numSourcesRequested} sources with rationale. Default to:
   - 3-4 primary sources
   - 2-3 secondary sources
   - At least 1 visual/statistical source
   - No more than 2 sources with the same perspective role

6. Flag any source that is too difficult, redundant, context-dependent, or weak in provenance.

## Output Format
Return a JSON object with this exact structure:
{
  "inquiryQuestion": "The inquiry question (use provided one or generate one)",
  "sources": [
    {
      "title": "Source title",
      "summary": "2-3 sentence summary. Start with source type label like [PRIMARY - Letter] or [SECONDARY - Textbook excerpt] or [VISUAL - Political cartoon]",
      "sourceType": "primary_written | secondary | visual | statistical | map | political_cartoon | speech | letter | diary | law | newspaper | oral_history | artifact",
      "perspectiveRole": "government_elite | ordinary_people | outsider | historian | visual_statistical | counterevidence",
      "bibliographicInfo": "Full bibliographic citation",
      "link": "Direct URL to the source (or best known URL). If no link available, write 'No direct link available'",
      "creator": "Author/creator name",
      "dateCreated": "Date or date range when the source was created",
      "significance": "Why this source matters for the inquiry question",
      "claimsEvidence": "What claims, evidence, insights, bias, or limitations students could pull from this",
      "historicalThinkingMove": "What historical thinking skill this source supports (e.g., perspective-taking, cause and consequence, corroboration)",
      "lengthDescription": "How long is the original source",
      "excerptOptions": "Options to shorten it for classroom use",
      "vocabularyBarriers": "Likely vocabulary or context barriers for students",
      "relevanceScore": 4,
      "readabilityScore": 3,
      "excerptabilityScore": 5,
      "historicalThinkingScore": 4,
      "uniquenessScore": 4,
      "overallScore": 4.0,
      "confidenceLevel": "high | medium | low",
      "isRecommended": true,
      "sequenceOrder": 1,
      "flags": "Any flags (too difficult, too long, redundant, etc.) or empty string"
    }
  ]
}

IMPORTANT:
- Only include sources you genuinely believe exist. Do not fabricate sources.
- For recommended sources, set isRecommended=true and assign sequenceOrder (1-based).
- For non-recommended candidates, set isRecommended=false and sequenceOrder=null.
- Include ALL 15-20 candidate sources in the array, with only ${bank.numSourcesRequested} marked as recommended.
- Always provide the most specific, accurate link you can. Flag confidence level honestly.`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Update inquiry question if it was generated
    if (parsed.inquiryQuestion && !bank.inquiryQuestion) {
      await prisma.sourceBank.update({
        where: { id },
        data: { inquiryQuestion: parsed.inquiryQuestion },
      });
    }

    // Save all sources
    if (parsed.sources && Array.isArray(parsed.sources)) {
      for (const source of parsed.sources) {
        await prisma.candidateSource.create({
          data: {
            sourceBankId: id,
            title: source.title || "Untitled",
            summary: source.summary || "",
            sourceType: source.sourceType || "",
            perspectiveRole: source.perspectiveRole || "",
            bibliographicInfo: source.bibliographicInfo || "",
            link: source.link || "",
            creator: source.creator || "",
            dateCreated: source.dateCreated || "",
            significance: source.significance || "",
            claimsEvidence: source.claimsEvidence || "",
            historicalThinkingMove: source.historicalThinkingMove || "",
            lengthDescription: source.lengthDescription || "",
            excerptOptions: source.excerptOptions || "",
            vocabularyBarriers: source.vocabularyBarriers || "",
            relevanceScore: source.relevanceScore || 0,
            readabilityScore: source.readabilityScore || 0,
            excerptabilityScore: source.excerptabilityScore || 0,
            historicalThinkingScore: source.historicalThinkingScore || 0,
            uniquenessScore: source.uniquenessScore || 0,
            overallScore: source.overallScore || 0,
            confidenceLevel: source.confidenceLevel || "medium",
            isRecommended: source.isRecommended || false,
            sequenceOrder: source.sequenceOrder ?? null,
            flags: source.flags || "",
          },
        });
      }

      // Save recommended sequence
      const recommendedIds = parsed.sources
        .filter((s: Record<string, unknown>) => s.isRecommended)
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
          ((a.sequenceOrder as number) ?? 99) - ((b.sequenceOrder as number) ?? 99)
        )
        .map((s: Record<string, unknown>) => s.title);

      await prisma.sourceBank.update({
        where: { id },
        data: {
          status: "completed",
          recommendedSequence: recommendedIds,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Source generation error:", error);
    await prisma.sourceBank.update({
      where: { id },
      data: { status: "error" },
    });
    return NextResponse.json(
      { error: "Failed to generate sources" },
      { status: 500 }
    );
  }
}
