import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

// Shared output format instructions
const HOOK_OUTPUT_FORMAT = `Output the Hook / Opener in this format:

Hook / Opener
Purpose: [1-2 sentences explaining what this opener is designed to do]
Teacher Moves: [clear step-by-step sequence]
Student Task: [what students do]
Timing: [estimated minutes]
Materials / Prep: [what is needed, if anything]
Bridge to Lesson: [exact or near-exact teacher language showing how this hook connects to the lesson]`;

const CHECK_OUTPUT_FORMAT = `Output the Check for Understanding in this format:

Check for Understanding
Purpose: [1-2 sentences explaining what understanding this check is meant to reveal]
Teacher Moves: [clear step-by-step sequence]
Student Task: [what students do]
Timing: [estimated minutes]
Evidence Collected: [what the teacher actually sees, hears, reads, or gathers]
How to Interpret It: [what strong, partial, or weak responses would suggest]
Materials / Prep: [what is needed, if anything]
Bridge Forward: [exact or near-exact teacher language showing how the teacher would move on based on the check]`;

const CLOSURE_OUTPUT_FORMAT = `Output the Closure / Exit in this format:

Closure / Exit
Purpose: [1-2 sentences explaining what this closure is designed to help students do]
Teacher Moves: [clear step-by-step sequence]
Student Task: [what students do]
Timing: [estimated minutes]
Materials / Prep: [what is needed, if anything]
What This Reveals: [what the teacher may learn from how students respond]
Bridge Beyond the Lesson: [exact or near-exact teacher language connecting the closure to the objective, bigger idea, or next lesson]`;

const ACTIVITY_OUTPUT_FORMAT = `Output 3 versions of the Main Learning Activity in this format for each:

Version N
Main Learning Activity
Purpose: [1-2 sentences explaining what students are meant to learn or do intellectually]
Teacher Moves: [clear step-by-step sequence]
Student Task: [what students do]
Grouping: [individual, partners, small groups, whole class, or combination]
Timing: [estimated minutes]
Materials / Prep: [what is needed, if anything]
Look-Fors / Success Indicators: [what the teacher should listen for, observe, or collect]
Bridge to Next Section: [exact or near-exact teacher language showing how this activity transitions forward]`;

const SECTION_PROMPTS: Record<string, Record<string, string>> = {
  curriculumConnection: {
    align_curriculum:
      "Based on the lesson context and BC curriculum standards, suggest the Big Idea, Curricular Competency Focus, and Content Connection. Return as JSON: {\"bigIdea\": \"...\", \"competencyFocus\": \"...\", \"contentConnection\": \"...\"}",
    suggest_big_ideas:
      "Suggest relevant Big Ideas from the BC curriculum that connect to this lesson. Return as a brief paragraph.",
  },
  learningTarget: {
    write_target:
      `Write a clear, student-facing learning target for this lesson. Include:
1. An "I can..." statement (1-2 sentences)
2. Success Criteria: 3-4 specific, observable criteria
3. Three Inquiry Questions:
   - Factual: A knowledge-based question with a definitive answer
   - Conceptual: A transferable question about patterns, causes, or significance
   - Debatable: An open question requiring evidence and reasoning

Format as:
I can [target].

Success Criteria:
- [criterion 1]
- [criterion 2]
- [criterion 3]

Inquiry Questions:
Factual: [question]
Conceptual: [question]
Debatable: [question]`,
    simplify_target:
      "Simplify the existing learning target to be more student-friendly. Preserve the I can statement, success criteria, and inquiry questions structure but use simpler language appropriate for the grade level.",
  },
  lessonPurpose: {
    explain_connection:
      "Explain why this lesson exists in the context of the unit and course. How does it build on previous lessons and set up future ones? Keep it to 2-3 sentences.",
  },
  materialsNeeded: {
    generate_materials:
      "Generate a practical materials list for this lesson. Include both physical and digital materials. Return as a newline-separated list.",
  },

  // ── HOOK: Adapt actions ──
  hook: {
    adapt_more_engaging: `You are revising the existing Hook / Opener. Keep its basic purpose but increase tension, surprise, choice, debate, emotional investment, or student participation. Do not simply make it "more fun" — make it more compelling. ${HOOK_OUTPUT_FORMAT}`,
    adapt_more_relevant: `You are revising the existing Hook / Opener. Connect more naturally to student experiences, school life, fairness, identity, current habits, media, or social structures. Do this without sounding forced or fake. ${HOOK_OUTPUT_FORMAT}`,
    adapt_shorter: `You are revising the existing Hook / Opener. Preserve the same opening purpose but reduce steps, teacher talk, materials, and setup time. Keep it tighter and quicker. ${HOOK_OUTPUT_FORMAT}`,
    adapt_less_prep: `You are revising the existing Hook / Opener. Remove or reduce handouts, props, elaborate visuals, or extra setup demands. Keep the same hook logic if possible. ${HOOK_OUTPUT_FORMAT}`,
    adapt_more_discussion: `You are revising the existing Hook / Opener. Increase opportunities for partner talk, quick debate, ranking, continuum responses, or share-out. Move the hook toward active student talk and thinking. ${HOOK_OUTPUT_FORMAT}`,
    adapt_clearer_connection: `You are revising the existing Hook / Opener. Strengthen the debrief, transition, and explanation of why students are doing this opener. Students should more clearly understand how the opener connects to the lesson. ${HOOK_OUTPUT_FORMAT}`,

    // ── HOOK: Other Types actions ──
    other_prediction: `Replace the current hook with a PREDICTION hook. Frame the lesson around a prediction students make before learning the content. Create a short scenario with real tension or uncertainty, include enough context to make it understandable, end with a prediction question. Students should respond using intuition, not prior knowledge. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_problem_mystery: `Replace the current hook with a PROBLEM-BASED / MYSTERY-BASED hook. Create a puzzling problem that is surprising, contradictory, or hard to explain. Students should feel a genuine need for the lesson knowledge. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_connection_today: `Replace the current hook with a CONNECTION TO TODAY hook. Begin with a real present-day pattern, issue, habit, system, or assumption. Build a clear bridge showing how the lesson topic helps explain the present-day reality. Avoid shallow or fake relevance. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_surprise: `Replace the current hook with a SURPRISE FRAMING hook. Students first react to incomplete or misleading information, then an important reveal changes their understanding. The reveal should illuminate the lesson concept, not be a cheap gimmick. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_continuum: `Replace the current hook with a CONTINUUM / BAROMETER hook. Generate 3-5 debatable statements that provoke disagreement or interpretation. Students respond on a spectrum through four corners, continuum, or quick discussion. Statements should be worth revisiting later. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_image: `Replace the current hook with an IMAGE HOOK. Use a visual source (image, graph, map, artifact, political cartoon) with a simple thinking routine. The visual work should lead naturally into the lesson. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_mini_demo: `Replace the current hook with a MINI DEMONSTRATION. Create a brief, concrete, low-prep, classroom-safe demonstration that makes an abstract concept visible. Keep it realistic for a normal teacher to run. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_analogy: `Replace the current hook with a STUDENT-RELEVANT ANALOGY. Connect the topic to a student-familiar social situation, school situation, or everyday structure. The analogy should clarify the core concept before formal learning. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_ranking: `Replace the current hook with a RANKING / PRIORITIZATION hook. Create a ranking task that quickly generates reasoning and talk. Students rank causes, factors, injustices, dangers, priorities, or explanations. Ranking must require judgment, not recall. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_quote: `Replace the current hook with a QUOTE / VOICE HOOK. Begin with a short quote, diary line, law, testimony, or speech excerpt. Students should infer who might say this, what tensions or values it reveals. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
    other_error_analysis: `Replace the current hook with an ERROR ANALYSIS / MISCONCEPTION hook. Present a flawed claim, oversimplification, or misconception. Students critique, question, or revise it. The lesson then builds deeper understanding. Generate 3 structurally distinct versions. ${HOOK_OUTPUT_FORMAT}`,
  },

  // ── ACTIVITIES: Adapt actions ──
  activities: {
    adapt_more_engaging: `You are revising the existing lesson sequence. Increase student engagement by adding more tension, choice, movement, collaboration, or variety without changing the core learning goals. Return as JSON array: [{"name":"...","duration":"X","description":"..."}]`,
    adapt_shorter: `You are revising the existing lesson sequence. Tighten the timing, reduce steps, and streamline transitions while preserving the core learning. Return as JSON array: [{"name":"...","duration":"X","description":"..."}]`,
    adapt_more_collaborative: `You are revising the existing lesson sequence. Increase meaningful collaboration — add pair work, group tasks, structured discussion, or jigsaw elements. Return as JSON array: [{"name":"...","duration":"X","description":"..."}]`,
    adapt_more_scaffolded: `You are revising the existing lesson sequence. Add more scaffolding — sentence starters, graphic organizers, modeling, chunked instructions, or check-ins. Return as JSON array: [{"name":"...","duration":"X","description":"..."}]`,
    adapt_clearer_transitions: `You are revising the existing lesson sequence. Strengthen transitions between activities with explicit teacher language and clearer logical flow. Return as JSON array: [{"name":"...","duration":"X","description":"..."}]`,
    adapt_more_choice: `You are revising the existing lesson sequence. Add student choice — let students choose between tasks, sources, products, or approaches while maintaining alignment. Return as JSON array: [{"name":"...","duration":"X","description":"..."}]`,

    // ── ACTIVITIES: Other Types actions ──
    other_jigsaw: `Replace the current activities with a JIGSAW structure. Students become responsible for one part of the content, then teach/share with others. Include accountability for both expert learning and sharing. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_station_rotation: `Replace the current activities with a STATION ROTATION. Students rotate through purposeful and distinct tasks, prompts, or sources. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_gallery_walk: `Replace the current activities with a GALLERY WALK. Students move, view, respond to, compare, or annotate posted material. Responses should require thinking, not just copying. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_card_sort: `Replace the current activities with a CARD SORT. Students categorize, sequence, match, rank, or group cards. The sorting logic should reveal important concepts or relationships. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_ranking_task: `Replace the current activities with a RANKING TASK. Students rank items based on importance, causation, fairness, urgency, influence, or credibility, with justification. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_source_analysis: `Replace the current activities with a SOURCE ANALYSIS. Students analyze sources for meaning, evidence, perspective, bias, context, or significance. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_structured_debate: `Replace the current activities with a STRUCTURED DEBATE. Students prepare and respond to a clear question or claim with evidence. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_silent_discussion: `Replace the current activities with a SILENT DISCUSSION. Students respond in writing to prompts, quotes, images, or classmates' ideas. Prompts must sustain thought. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_roleplay: `Replace the current activities with a ROLE-PLAY / SIMULATION. Students take on roles, perspectives, or decisions connected to the topic. Must illuminate content, not just entertain. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_case_study: `Replace the current activities with a CASE STUDY. Students investigate a focused example that helps reveal the broader lesson concept. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_modeling: `Replace the current activities with TEACHER MODELING + GUIDED PRACTICE. Teacher explicitly models the thinking or process, then students practice with support. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_partner_analysis: `Replace the current activities with PARTNER ANALYSIS. Students work in pairs to analyze, solve, interpret, or discuss. Both partners should have a real role. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_independent_inquiry: `Replace the current activities with INDEPENDENT INQUIRY. Students investigate a question, set of sources, or problem with some autonomy. Still enough structure to keep it purposeful. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_graphic_organizer: `Replace the current activities with a GRAPHIC ORGANIZER ANALYSIS. Use an organizer to help students compare, sort, track, interpret, or synthesize ideas. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
    other_problem_solving: `Replace the current activities with a PROBLEM-SOLVING TASK. Students work through a problem, scenario, case, or challenge requiring application of lesson ideas. Generate 3 structurally distinct versions. ${ACTIVITY_OUTPUT_FORMAT}`,
  },

  // ── ASSESSMENT: Adapt actions ──
  assessment: {
    adapt_faster: `You are revising the existing Check for Understanding. Make it quicker to run and faster to interpret while preserving meaningful evidence. ${CHECK_OUTPUT_FORMAT}`,
    adapt_more_diagnostic: `You are revising the existing Check for Understanding. Make it better at revealing misconceptions, partial understanding, or specific confusion points. ${CHECK_OUTPUT_FORMAT}`,
    adapt_more_aligned: `You are revising the existing Check for Understanding. Make it more directly measure the stated lesson goal, not just general participation or recall. ${CHECK_OUTPUT_FORMAT}`,
    adapt_more_discussion: `You are revising the existing Check for Understanding. Build in brief structured talk while still preserving observable evidence of understanding. ${CHECK_OUTPUT_FORMAT}`,
    adapt_individual: `You are revising the existing Check for Understanding. Ensure each student must produce or show their own thinking, not just rely on group answers. ${CHECK_OUTPUT_FORMAT}`,
    adapt_easier_assess: `You are revising the existing Check for Understanding. Make the evidence easier for the teacher to scan, hear, categorize, or interpret in real time. ${CHECK_OUTPUT_FORMAT}`,
    adapt_reluctant: `You are revising the existing Check for Understanding. Reduce risk, pressure, or exposure while still getting meaningful evidence. ${CHECK_OUTPUT_FORMAT}`,
    adapt_lower_reading: `You are revising the existing Check for Understanding. Reduce text load, wording complexity, or reading dependence while keeping the thinking intact. ${CHECK_OUTPUT_FORMAT}`,
    adapt_whole_class: `You are revising the existing Check for Understanding. Make it easier for the teacher to quickly gauge how the class as a whole is doing. ${CHECK_OUTPUT_FORMAT}`,

    // ── ASSESSMENT: Other Types actions ──
    other_exit_slip: `Replace the current check with an EXIT SLIP. Short, focused, clearly tied to the objective. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_whiteboard: `Replace the current check with a MINI WHITEBOARD CHECK. Students respond visibly and quickly; teacher can scan class patterns fast. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_poll: `Replace the current check with a POLL / VOTE. Use a forced choice, ranking, or stance that reveals understanding, not just opinion. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_quickwrite: `Replace the current check with a QUICKWRITE. Brief written response requiring explanation, not just recall. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_turn_explain: `Replace the current check with TURN-AND-EXPLAIN. Structured partner explanation with a way for the teacher to observe or sample understanding. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_retrieval: `Replace the current check with RETRIEVAL QUESTIONS. Prompt recall of key ideas in a way that supports understanding. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_misconception: `Replace the current check with a MISCONCEPTION CHECK. Surface likely errors, oversimplifications, or confusions. Students critique, revise, or choose between ideas. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_one_sentence: `Replace the current check with a ONE-SENTENCE SUMMARY. Students compress understanding clearly and accurately. Sentence stem may be used. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_ranking: `Replace the current check with a RANKING / JUSTIFICATION. Students rank items and justify reasoning to reveal conceptual understanding. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_cold_call: `Replace the current check with COLD-CALL DISCUSSION PROMPTS. Teacher asks targeted questions to sample understanding across students. Prompts should be clear, fair, and aligned. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_graphic: `Replace the current check with a GRAPHIC RESPONSE. Students show understanding through a sketch, chart, diagram, symbol, or labeled visual. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
    other_self_assessment: `Replace the current check with a SELF-ASSESSMENT SCALE. Students rate confidence or understanding with a prompt that makes the self-assessment meaningful. Generate 3 structurally distinct versions. ${CHECK_OUTPUT_FORMAT}`,
  },

  // ── CLOSURE: Adapt actions ──
  closure: {
    adapt_more_reflective: `You are revising the existing Closure / Exit. Increase personal reflection, meaning-making, perspective-taking, or thoughtful looking back on learning. ${CLOSURE_OUTPUT_FORMAT}`,
    adapt_more_summary: `You are revising the existing Closure / Exit. Help students synthesize the key learning clearly and concisely. ${CLOSURE_OUTPUT_FORMAT}`,
    adapt_more_discussion: `You are revising the existing Closure / Exit. Add structured verbal sharing, partner reflection, or class synthesis. Not just unstructured talk. ${CLOSURE_OUTPUT_FORMAT}`,
    adapt_faster: `You are revising the existing Closure / Exit. Preserve the same closing purpose but reduce steps and time demand. ${CLOSURE_OUTPUT_FORMAT}`,
    adapt_stronger_connection: `You are revising the existing Closure / Exit. Make it more directly tied to the lesson goal and what students were supposed to understand or do. ${CLOSURE_OUTPUT_FORMAT}`,
    adapt_better_transition: `You are revising the existing Closure / Exit. Help students leave with a question, bridge, unresolved tension, or preview that sets up the next lesson. ${CLOSURE_OUTPUT_FORMAT}`,
    adapt_more_voice: `You are revising the existing Closure / Exit. Give students more room to express their own ideas, takeaways, or changed thinking. ${CLOSURE_OUTPUT_FORMAT}`,
    adapt_more_metacognitive: `You are revising the existing Closure / Exit. Help students reflect on how their thinking changed, what helped them understand, what remains confusing, or how they approached the learning. ${CLOSURE_OUTPUT_FORMAT}`,

    // ── CLOSURE: Other Types actions ──
    other_exit_ticket: `Replace the current closure with an EXIT TICKET. Short written response, focused and clearly aligned to the objective. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_one_sentence: `Replace the current closure with a ONE-SENTENCE TAKEAWAY. Students compress learning into one clear sentence requiring thought, not cliché. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_turn_talk: `Replace the current closure with TURN-AND-TALK SYNTHESIS. Brief verbal synthesis with a partner, clear prompt and possible share-out. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_revisit_opener: `Replace the current closure with REVISIT THE OPENER. Return to the original hook, question, dilemma, image, claim, or scenario. Students revise, deepen, or reconsider their earlier thinking. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_revisit_continuum: `Replace the current closure with REVISIT CONTINUUM STATEMENT. Students return to an earlier statement or stance and explain whether or why their position changed. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_reflection: `Replace the current closure with a REFLECTION PROMPT. Prompt deeper reflection on meaning, perspective, or significance. Focused, not generic. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_debate_revisit: `Replace the current closure with a QUICK DEBATE REVISIT. Return to a disputed claim or question. Students respond with better evidence or reasoning than at the start. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_thinking_change: `Replace the current closure with WHAT CHANGED IN YOUR THINKING? Explicitly focus on shift in understanding. Surface growth, revision, or nuance. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_self_assessment: `Replace the current closure with a SELF-ASSESSMENT. Students rate or describe their understanding, confidence, or readiness with a meaningful prompt. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_prediction_revisit: `Replace the current closure with a PREDICTION REVISIT. Students return to an earlier prediction and compare what they predicted with what they learned. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
    other_summary_sketch: `Replace the current closure with a SUMMARY SKETCH / VISUAL SYNTHESIS. Students show understanding through a quick visual, symbol, diagram, or sketch tied meaningfully to the lesson. Generate 3 structurally distinct versions. ${CLOSURE_OUTPUT_FORMAT}`,
  },

  scaffolds: {
    scaffolding_strategies:
      "Suggest specific scaffolding strategies for students who may struggle with this lesson content. Include concrete examples.",
    sentence_starters:
      "Create sentence starters or frames that support students in expressing their understanding of the lesson content.",
  },
  extension: {
    challenge_questions:
      "Create 2-3 challenging extension questions for students who finish early or need more depth.",
    extension_activity:
      "Design an extension activity that deepens engagement with the lesson content for advanced learners.",
  },
  all: {
    full_plan:
      `Generate a complete lesson plan filling all sections. Return as JSON with these fields:
{
  "hook": "...",
  "learningTarget": "I can [target].\\n\\nSuccess Criteria:\\n- [criterion 1]\\n- [criterion 2]\\n- [criterion 3]\\n\\nInquiry Questions:\\nFactual: [question]\\nConceptual: [question]\\nDebatable: [question]",
  "lessonPurpose": "...",
  "materialsNeeded": "...",
  "activities": [{"name": "...", "duration": "X", "description": "..."}],
  "closure": "...",
  "assessment": "...",
  "scaffolds": "...",
  "extension": "...",
  "curriculumConnection": {"bigIdea": "...", "competencyFocus": "...", "contentConnection": "..."}
}
Make it practical, specific, and engaging. Align to BC curriculum standards where possible.`,
    review:
      "Review the current lesson plan and suggest specific improvements for each section. Be constructive and practical.",
    align:
      "Analyze how well this lesson aligns with BC curriculum standards. Suggest specific improvements to strengthen alignment.",
    timing:
      "Analyze the activity timing in this lesson. Suggest adjustments to ensure the lesson fits within the allotted duration. Be specific about which activities to shorten or extend.",
  },
};

async function gatherLessonContext(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      unit: {
        include: {
          course: true,
          lessons: { orderBy: { order: "asc" }, select: { title: true, status: true } },
        },
      },
      tags: true,
    },
  });

  if (!lesson) return { lesson: null, context: "" };

  const parts: string[] = [];

  if (lesson.unit?.course) {
    parts.push(
      `Course: "${lesson.unit.course.title}" (${lesson.unit.course.subject}, Grade ${lesson.unit.course.gradeLevel})`
    );
  }

  if (lesson.unit) {
    parts.push(`Unit: "${lesson.unit.title}"`);
    if (lesson.unit.bigIdea) parts.push(`Unit Big Idea: ${lesson.unit.bigIdea}`);
    const otherLessons = lesson.unit.lessons.filter((l) => l.title !== lesson.title);
    if (otherLessons.length > 0) {
      parts.push(`Other lessons in unit: ${otherLessons.map((l) => l.title).join(", ")}`);
    }
  }

  parts.push(`Lesson: "${lesson.title}"`);
  parts.push(`Duration: ${lesson.duration} minutes`);

  if (lesson.learningObjectives) parts.push(`Learning Objectives: ${lesson.learningObjectives}`);
  if (lesson.hook) parts.push(`Hook: ${lesson.hook}`);

  const cc = lesson.curriculumConnection as { bigIdea?: string; competencyFocus?: string; contentConnection?: string } | null;
  if (cc) {
    if (cc.bigIdea) parts.push(`Big Idea: ${cc.bigIdea}`);
    if (cc.competencyFocus) parts.push(`Competency Focus: ${cc.competencyFocus}`);
    if (cc.contentConnection) parts.push(`Content Connection: ${cc.contentConnection}`);
  }

  if (lesson.activities && JSON.stringify(lesson.activities) !== "[]") {
    parts.push(`Activities: ${JSON.stringify(lesson.activities)}`);
  }
  if (lesson.assessment) parts.push(`Assessment: ${lesson.assessment}`);
  if (lesson.closure) parts.push(`Closure: ${lesson.closure}`);

  // Fetch BC curriculum standards if course has grade level
  if (lesson.unit?.course?.gradeLevel) {
    const standards = await prisma.curriculumStandard.findMany({
      where: {
        subject: lesson.unit.course.subject,
        gradeLevel: lesson.unit.course.gradeLevel,
      },
      take: 20,
    });
    if (standards.length > 0) {
      parts.push("\nBC Curriculum Standards:");
      for (const std of standards) {
        parts.push(`  [${std.category}] ${std.description}`);
      }
    }
  }

  return { lesson, context: parts.join("\n") };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { section, action } = body;

    if (!section || !action) {
      return Response.json(
        { error: "section and action are required" },
        { status: 400 }
      );
    }

    const sectionPrompts = SECTION_PROMPTS[section];
    if (!sectionPrompts || !sectionPrompts[action]) {
      return Response.json(
        { error: `Unknown section/action: ${section}/${action}` },
        { status: 400 }
      );
    }

    const { lesson, context } = await gatherLessonContext(id);
    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    const systemPrompt = `You are a curriculum planning assistant helping a teacher build lesson plans. You specialize in BC (British Columbia) curriculum for Social Studies (Grades 6-12). Be practical, specific, and concise. When generating content, make it ready to use — not generic or placeholder-like.

Current lesson context:
${context}`;

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: sectionPrompts[action],
        },
      ],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ content });
  } catch (error) {
    console.error("Failed to generate:", error);
    return Response.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
