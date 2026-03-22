import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const { topic, grade } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  const gradeContext = grade ? ` for Grade ${grade} students` : " for middle/high school students";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate 5 rich, debatable inquiry questions about "${topic}"${gradeContext} that would lend themselves well to source-based investigations (DBQs, History Labs, Structured Academic Controversies).

Each question should:
- Be genuinely debatable using historical evidence
- Invite multiple perspectives
- Be answerable through source analysis, not just opinion
- Be written in student-friendly language

Return as JSON: {"questions": ["Question 1", "Question 2", ...]}`,
      },
    ],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return NextResponse.json(parsed);
    }
  } catch {
    // fallback
  }

  return NextResponse.json({ questions: [] });
}
