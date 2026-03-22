// Resource generation prompt configurations for each template type

interface LessonData {
  title: string;
  hook: string;
  learningTarget: string;
  lessonPurpose: string;
  materialsNeeded: string;
  activities: Array<{ name: string; duration: string; description: string }>;
  closure: string;
  assessment: string;
  scaffolds: string;
  extension: string;
  notes: string;
  curriculumConnection: {
    bigIdea: string;
    competencyFocus: string;
    contentConnection: string;
  };
  unit?: { title: string; course?: { title: string; gradeLevel: string } } | null;
}

export interface ResourcePromptConfig {
  type: string;
  title: string;
  userPrompt: string;
  parseResponse: (text: string) => Record<string, unknown>;
}

export interface ResourceOption {
  type: string;
  title: string;
}

function serializeLessonContext(lesson: LessonData): string {
  const parts: string[] = [];
  parts.push(`LESSON TITLE: ${lesson.title}`);
  if (lesson.unit?.course) {
    parts.push(`COURSE: ${lesson.unit.course.title} (Grade ${lesson.unit.course.gradeLevel})`);
  }
  if (lesson.unit) {
    parts.push(`UNIT: ${lesson.unit.title}`);
  }
  if (lesson.learningTarget) parts.push(`LEARNING TARGET: ${lesson.learningTarget}`);
  if (lesson.lessonPurpose) parts.push(`LESSON PURPOSE: ${lesson.lessonPurpose}`);
  if (lesson.hook) parts.push(`HOOK/OPENER: ${lesson.hook}`);
  if (lesson.activities?.length) {
    parts.push(`ACTIVITIES:\n${lesson.activities.map((a, i) => `  ${i + 1}. ${a.name} (${a.duration}) — ${a.description}`).join("\n")}`);
  }
  if (lesson.closure) parts.push(`CLOSURE/DEBRIEF: ${lesson.closure}`);
  if (lesson.assessment) parts.push(`ASSESSMENT: ${lesson.assessment}`);
  if (lesson.scaffolds) parts.push(`SCAFFOLDS: ${lesson.scaffolds}`);
  if (lesson.extension) parts.push(`EXTENSION: ${lesson.extension}`);
  if (lesson.materialsNeeded) parts.push(`MATERIALS: ${lesson.materialsNeeded}`);
  if (lesson.notes) parts.push(`TEACHER NOTES (includes historical background, timeline, group roles, decision options):\n${lesson.notes}`);
  if (lesson.curriculumConnection?.bigIdea) {
    parts.push(`CURRICULUM CONNECTION:\n  Big Idea: ${lesson.curriculumConnection.bigIdea}\n  Competency: ${lesson.curriculumConnection.competencyFocus}\n  Content: ${lesson.curriculumConnection.contentConnection}`);
  }
  return parts.join("\n\n");
}

function parseJSON(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

function parseJSONWithRoles(text: string): Record<string, unknown> {
  const parsed = parseJSON(text);
  if (!parsed.roles) {
    throw new Error("No roles array found in response");
  }
  return parsed;
}

function parseJSONWithSections(text: string): Record<string, unknown> {
  const parsed = parseJSON(text);
  if (!parsed.sections) {
    throw new Error("No sections array found in response");
  }
  return parsed;
}

function parseJSONWithSlides(text: string): Record<string, unknown> {
  const parsed = parseJSON(text);
  if (!parsed.slides) {
    throw new Error("No slides array found in response");
  }
  return parsed;
}

function parseJSONWithQuestions(text: string): Record<string, unknown> {
  const parsed = parseJSON(text);
  if (!parsed.questions) {
    throw new Error("No questions array found in response");
  }
  return parsed;
}

// Full Lesson Plan resource — always available for every lesson
function getFullLessonPlanPrompt(lesson: LessonData): ResourcePromptConfig {
  const context = serializeLessonContext(lesson);

  return {
    type: "lesson_plan",
    title: "Full Lesson Plan",
    userPrompt: `You are creating a comprehensive, polished lesson plan document based on the following lesson data:

${context}

Create a detailed, professional lesson plan document that a teacher could print and follow. Organize it into clear sections with all the information a teacher would need to deliver this lesson effectively.

The document should include these sections (skip any that have no content):
1. Lesson Overview — title, course, unit, duration, learning target, lesson purpose
2. Curriculum Connections — big idea, competency focus, content connections
3. Materials Needed — everything the teacher needs to prepare
4. Lesson Sequence:
   a. Hook/Opener — how to begin the lesson
   b. Activities — each activity with name, duration, and detailed instructions
   c. Closure/Debrief — how to wrap up
5. Assessment — how to check for understanding
6. Scaffolds & Supports — accommodations and differentiation
7. Extension — for students who finish early or want to go deeper
8. Teacher Notes — any additional background, tips, or context

Write in a professional but practical tone. Use clear formatting with headings and bullet points. This should read as a polished, ready-to-use teacher document, not raw data.

Return as JSON with this exact structure:
{"sections":[{"heading":"Section heading","content":"Section content with line breaks as \\n"}]}`,
    parseResponse: (text: string) => {
      const parsed = parseJSON(text);
      if (!parsed.sections) {
        throw new Error("No sections array found in response");
      }
      return parsed;
    },
  };
}

// Generic resources for any lesson (non-template)
function getGenericResourcePrompts(lesson: LessonData): ResourcePromptConfig[] {
  const context = serializeLessonContext(lesson);

  return [
    // Student Handout — always useful
    {
      type: "reading",
      title: "Student Handout",
      userPrompt: `You are creating a student-facing handout based on this lesson plan:

${context}

Create a one-page student handout that provides the key information, instructions, or content students need for this lesson. The format should match the lesson type — it could be an information sheet, a set of instructions, a reading passage, a reference guide, or a combination.

The handout should:
- Be appropriate for the grade level
- Present information clearly and concisely
- Include only what students need to participate in the lesson
- Have a clear title and organized sections

Return as JSON with this exact structure:
{"title":"Handout title","subtitle":"Optional subtitle or context line","sections":[{"heading":"Section heading (optional, use empty string if not needed)","content":"Section content text"}]}`,
      parseResponse: parseJSON,
    },

    // Activity Worksheet
    {
      type: "worksheet",
      title: "Activity Worksheet",
      userPrompt: `You are creating a student worksheet based on this lesson plan:

${context}

Create a structured worksheet that guides students through the main activity or activities in this lesson. The worksheet should scaffold student thinking with clear prompts, questions, and space for responses.

The worksheet should:
- Directly connect to the learning target and activities
- Include clear instructions for each section
- Use a mix of question types appropriate to the content
- Be appropriate for the grade level

Return as JSON with this exact structure:
{"sections":[{"heading":"Section title","instructions":"Brief instruction for students","prompts":["Specific prompt or question 1","Specific prompt or question 2"],"responseType":"lines or paragraph or list or table"}]}`,
      parseResponse: parseJSONWithSections,
    },

    // Slides
    {
      type: "slides",
      title: "Lesson Slides",
      userPrompt: `You are creating a teacher presentation based on this lesson plan:

${context}

Create a slide deck (5-8 slides) that supports the delivery of this lesson. The slides should follow the lesson sequence and provide visual support for the teacher's instruction.

Slide structure should generally follow:
1. Title slide — Lesson title + learning target or essential question
2-3. Introduction/Hook slides — Setting context, activating prior knowledge
4-6. Main content/activity slides — Key information, instructions, or discussion prompts
7. Closure/Reflection slide
8. (Optional) Next steps or homework

Keep text concise — these are projected slides, not reading material. Include teacher notes for each slide with talking points.

Return as JSON with this exact structure:
{"slides":[{"title":"Slide title","body":"Slide body text (keep concise, use bullet points with • character)","notes":"Teacher notes and talking points for this slide"}]}`,
      parseResponse: parseJSONWithSlides,
    },

    // Exit Ticket / Quick Assessment
    {
      type: "assessment",
      title: "Exit Ticket",
      userPrompt: `You are creating a quick assessment / exit ticket based on this lesson plan:

${context}

Create a short exit ticket (3-5 questions) that checks student understanding of the key learning from this lesson. The exit ticket should be completable in 5 minutes or less.

Requirements:
- Questions should directly assess the learning target
- Mix of question types: 1-2 multiple choice, 1-2 short answer, and optionally one reflection question
- Appropriate difficulty for the grade level
- Include a complete answer key

Return as JSON with this exact structure:
{"title":"Exit Ticket title","instructions":"Brief instructions for students","questions":[{"number":1,"question":"Question text","type":"multiple_choice or short_answer or reflection","options":["A) Option text","B) Option text","C) Option text","D) Option text"],"answer":"Correct answer","explanation":"Brief explanation"}]}`,
      parseResponse: parseJSONWithQuestions,
    },
  ];
}

/** Get the list of available resource options for a lesson (used by the UI to show what can be generated) */
export function getResourceOptions(templateName: string): ResourceOption[] {
  const options: ResourceOption[] = [
    { type: "lesson_plan", title: "Full Lesson Plan" },
  ];

  if (templateName === "Historical Decision-Making") {
    options.push(
      { title: "Student Briefing Document", type: "reading" },
      { title: "Group Role Cards", type: "worksheet" },
      { title: "Decision Worksheet", type: "worksheet" },
      { title: "Student Intro Slides", type: "slides" },
      { title: "Quiz + Answer Key", type: "assessment" },
    );
  } else if (templateName === "History Lab") {
    options.push(
      { title: "Source Set & Analysis Guide", type: "reading" },
      { title: "Investigation Worksheet", type: "worksheet" },
      { title: "Lab Intro Slides", type: "slides" },
      { title: "Quiz + Answer Key", type: "assessment" },
    );
  } else if (templateName === "Philosophy for History") {
    options.push(
      { title: "Quote Collection & Context", type: "reading" },
      { title: "Philosophy Reflection Worksheet", type: "worksheet" },
      { title: "Discussion Slides", type: "slides" },
      { title: "Quiz + Answer Key", type: "assessment" },
    );
  } else if (templateName === "Structured Academic Controversy") {
    options.push(
      { title: "Source Set Document", type: "reading" },
      { title: "SAC Worksheet", type: "worksheet" },
      { title: "SAC Intro Slides", type: "slides" },
      { title: "Quiz + Answer Key", type: "assessment" },
    );
  } else {
    // Generic resources for any lesson
    options.push(
      { title: "Student Handout", type: "reading" },
      { title: "Activity Worksheet", type: "worksheet" },
      { title: "Lesson Slides", type: "slides" },
      { title: "Exit Ticket", type: "assessment" },
    );
  }

  return options;
}

export function getResourcePrompts(lesson: LessonData, templateName: string, selectedTitles?: string[]): ResourcePromptConfig[] {
  let allPrompts: ResourcePromptConfig[];

  const templatePromptMap: Record<string, (l: LessonData) => ResourcePromptConfig[]> = {
    "Historical Decision-Making": getHistoricalDecisionMakingPrompts,
    "History Lab": getHistoryLabPrompts,
    "Philosophy for History": getPhilosophyForHistoryPrompts,
    "Structured Academic Controversy": getSACPrompts,
  };

  const getTemplatePrompts = templatePromptMap[templateName];
  if (getTemplatePrompts) {
    allPrompts = [
      getFullLessonPlanPrompt(lesson),
      ...getTemplatePrompts(lesson),
    ];
  } else {
    allPrompts = [
      getFullLessonPlanPrompt(lesson),
      ...getGenericResourcePrompts(lesson),
    ];
  }

  // If specific titles were requested, filter to only those
  if (selectedTitles && selectedTitles.length > 0) {
    return allPrompts.filter((p) => selectedTitles.includes(p.title));
  }

  return allPrompts;
}

function getHistoricalDecisionMakingPrompts(lesson: LessonData): ResourcePromptConfig[] {
  const context = serializeLessonContext(lesson);

  return [
    // 1. Student Briefing Document
    {
      type: "reading",
      title: "Student Briefing Document",
      userPrompt: `You are creating a standalone student handout based on this lesson plan:

${context}

Create a one-page student briefing document for this Historical Decision-Making activity. The briefing should be formatted as the most appropriate document type (letter, confidential memo, advisory brief, report, or urgent message) from a historically appropriate sender.

The document should:
- Summarize the historical situation vividly and clearly
- Include the key historical information students need to understand the context
- Communicate urgency, pressure, and stakes
- Show competing concerns without oversimplifying important moral realities
- Feel authentic to the historical period and the sender's voice
- End with a clear task telling students they must decide on the best course of action and justify it
- Be written at an appropriate reading level for the grade

Return as JSON with this exact structure:
{"format":"letter or memo or brief","from":"Name and title of sender","to":"Who receives this (e.g. 'Members of the War Cabinet')","date":"Historical date in period-appropriate format","subject":"Subject line or re: line","body":["First paragraph text","Second paragraph text","Third paragraph text"],"closingTask":"The specific decision task students must complete"}`,
      parseResponse: parseJSON,
    },

    // 2. Role Cards
    {
      type: "worksheet",
      title: "Group Role Cards",
      userPrompt: `You are creating standalone student role cards based on this lesson plan:

${context}

Create 5 distinct group role cards for this Historical Decision-Making activity. One role must be the main decision-maker. The other 4 should represent meaningfully different competing perspectives, priorities, or pressures relevant to this historical decision.

Use real historical figures when appropriate, but plausible composite roles are acceptable when they strengthen the activity. The set of roles should still work if a group only has 3 students (the most essential roles should be the first 3).

Each role card should give students enough information to argue their position convincingly without requiring additional research.

Return as JSON with this exact structure:
{"roles":[{"title":"Role title (e.g. 'Prime Minister Neville Chamberlain')","who":"1-2 sentences: who this person is, their position, their background","whatTheyWant":"1-2 sentences: their primary goal or desired outcome","whatTheyFear":"1-2 sentences: what they are most afraid of or trying to avoid","biasOrPriority":"1-2 sentences: what instinct, bias, ideology, or priority shapes how they approach this decision"}]}`,
      parseResponse: parseJSONWithRoles,
    },

    // 3. Decision Worksheet
    {
      type: "worksheet",
      title: "Decision Worksheet",
      userPrompt: `You are creating a standalone student worksheet based on this lesson plan:

${context}

Create a scaffolded Decision Worksheet that guides students through the Historical Decision-Making process. The worksheet should be structured with clear headings, specific prompts, and appropriate space indicators for student responses.

The worksheet must include these sections (adapt the specific prompts to fit this particular historical scenario):
1. Context — What is the situation? What do you know?
2. Key Groups Involved — Who are the stakeholders? What does each group want?
3. Constraints & Limitations — What can't the decision-maker do? What resources/information are limited?
4. Understanding Your Options — Analyze each option (benefits, risks, who gains, who loses)
5. Overall Goal — What should the decision-maker be trying to achieve?
6. Your Initial Decision — What do you think should be done and why?
7. Anticipating Consequences — What could go wrong? What are the unintended effects?
8. Adjustments & Safeguards — How would you modify your decision to reduce risks?
9. Final Action Plan — Your revised decision with specific steps
10. Justification — A paragraph defending your decision using historical evidence

Make the prompts specific to this historical scenario, not generic. Include references to the actual historical figures, events, and options from the lesson.

Return as JSON with this exact structure:
{"sections":[{"heading":"Section title","instructions":"Brief instruction for students","prompts":["Specific prompt or question 1","Specific prompt or question 2"],"responseType":"lines or paragraph or list or table"}]}`,
      parseResponse: parseJSONWithSections,
    },

    // 4. Intro Slides
    {
      type: "slides",
      title: "Student Intro Slides",
      userPrompt: `You are creating a student-facing slide deck based on this lesson plan:

${context}

Create a short introductory slide deck (4-6 slides) for this Historical Decision-Making activity. The slides should introduce students to the historical context and set up the decision-making scenario.

Slide structure:
1. Title slide — Activity title + a compelling subtitle or question
2. WHAT — What is happening? Brief overview of the historical situation
3. WHERE & WHEN — Geographic and temporal context (keep concise)
4. WHY — Why does this matter? Why is this decision so difficult?
5. YOUR TASK — What students will be doing today (the decision they must make)
6. (Optional) Key terms or people students should know

Keep text concise — these are projected slides, not reading material. Use clear, direct language appropriate for the grade level. Each slide should have a clear title and short body text.

Include teacher notes for each slide with talking points and suggested delivery tips.

Return as JSON with this exact structure:
{"slides":[{"title":"Slide title","body":"Slide body text (keep concise, use bullet points with • character)","notes":"Teacher notes and talking points for this slide"}]}`,
      parseResponse: parseJSONWithSlides,
    },

    // 5. Quiz + Answer Key
    {
      type: "assessment",
      title: "Quiz + Answer Key",
      userPrompt: `You are creating a short assessment based on this lesson plan:

${context}

Create a short quiz (8-10 questions) that checks student understanding of both the historical content and the decision-making process from this activity.

Requirements:
- Mix of question types: multiple choice (4-5 questions), short answer (3-4 questions), and one brief constructed response
- Multiple choice questions should test factual understanding and historical reasoning (not trivial recall)
- Short answer questions should require students to demonstrate understanding of competing perspectives, constraints, or consequences
- The constructed response should ask students to reflect on the decision-making process or connect to a broader historical concept
- Questions should be answerable based on what students learned during the activity (no outside research needed)
- Include a complete answer key with brief explanations for each answer
- Appropriate difficulty for the grade level

Return as JSON with this exact structure:
{"title":"Quiz title","instructions":"Brief instructions for students","questions":[{"number":1,"question":"Question text","type":"multiple_choice or short_answer or constructed_response","options":["A) Option text","B) Option text","C) Option text","D) Option text"],"answer":"Correct answer (letter for MC, sample response for SA/CR)","explanation":"Brief explanation of why this is correct"}]}`,
      parseResponse: parseJSONWithQuestions,
    },
  ];
}

function getHistoryLabPrompts(lesson: LessonData): ResourcePromptConfig[] {
  const context = serializeLessonContext(lesson);

  return [
    // 1. Source Set & Analysis Guide
    {
      type: "reading",
      title: "Source Set & Analysis Guide",
      userPrompt: `You are creating a standalone student source packet based on this lesson plan:

${context}

Create a Source Set & Analysis Guide for this History Lab. The document should present each source clearly with supporting context so students can analyze them independently.

For each source (3-6 sources), include:
- Source number and title
- Source type (primary/secondary, letter/speech/image/map/etc.)
- Author/creator and date
- A brief student-friendly context paragraph (who created it, why, what was happening)
- Key vocabulary with brief definitions
- The source content or a clear description of what the source shows

At the end, include a "How to Analyze Sources" reference section with:
- SCOAPS framework reminder (Subject, Critique, Occasion, Audience, Purpose, Speaker)
- Tips for comparing sources
- Questions to ask about reliability

Return as JSON with this exact structure:
{"title":"Source Set title","subtitle":"Context line about the investigation","sections":[{"heading":"Source heading (e.g. Source 1: Title)","content":"Full source content including context, vocabulary, and the source text/description"}]}`,
      parseResponse: parseJSON,
    },

    // 2. Investigation Worksheet
    {
      type: "worksheet",
      title: "Investigation Worksheet",
      userPrompt: `You are creating a standalone student worksheet based on this lesson plan:

${context}

Create a scaffolded Investigation Worksheet for this History Lab that guides students from curiosity to claim.

The worksheet must include these sections:
1. Investigation Question — the inquiry question prominently displayed
2. What I Already Know — space for prior knowledge
3. My First Hypothesis — initial prediction before analyzing sources
4. Source Tracker — for each source in the set:
   - Source title / type
   - Who created it and when
   - What it says or shows (key information)
   - What makes it useful for this question
   - What might limit its reliability
   - Strongest piece of evidence from it
5. Comparing Sources — Where do they agree? Disagree? Which differences matter?
6. Evaluating Reliability — Which is most trustworthy for this question? Which needs careful use?
7. Gaps in the Evidence — What don't we know? What source would help next?
8. Final Conclusion — thesis statement, evidence from at least two sources, explanation

Include sentence starters where appropriate for struggling students.

Return as JSON with this exact structure:
{"sections":[{"heading":"Section title","instructions":"Brief instruction for students","prompts":["Specific prompt or question 1","Specific prompt or question 2"],"responseType":"lines or paragraph or list or table"}]}`,
      parseResponse: parseJSONWithSections,
    },

    // 3. Lab Intro Slides
    {
      type: "slides",
      title: "Lab Intro Slides",
      userPrompt: `You are creating a student-facing slide deck based on this lesson plan:

${context}

Create a short introductory slide deck (5-7 slides) for this History Lab. The slides should introduce the investigation, hook students with the inquiry question, and set up the source analysis task.

Slide structure:
1. Title slide — Lab title + compelling subtitle or image description
2. Your Mission — the student role and authentic purpose
3. The Investigation Question — the inquiry question prominently displayed
4. What We Know So Far — brief historical context students need
5. Your Sources — overview of what sources students will analyze
6. How to Investigate — brief reminder of SCOAPS or source analysis approach
7. (Optional) Key terms or people to know

Keep text concise — these are projected slides. Use detective/investigation-style language to build atmosphere.

Include teacher notes for each slide with talking points and delivery tips.

Return as JSON with this exact structure:
{"slides":[{"title":"Slide title","body":"Slide body text (keep concise, use bullet points with • character)","notes":"Teacher notes and talking points for this slide"}]}`,
      parseResponse: parseJSONWithSlides,
    },

    // 4. Quiz + Answer Key
    {
      type: "assessment",
      title: "Quiz + Answer Key",
      userPrompt: `You are creating a short assessment based on this lesson plan:

${context}

Create a short quiz (8-10 questions) that checks student understanding of the historical content, the inquiry question, and source analysis skills from this History Lab.

Requirements:
- Mix of question types: multiple choice (4-5), short answer (3-4), and one brief constructed response
- Multiple choice should test historical content knowledge and source interpretation (not trivial recall)
- Short answer should require students to demonstrate understanding of source reliability, perspective, or evidence comparison
- The constructed response should ask students to use evidence from specific sources to support a conclusion
- Questions should be answerable based on what students learned during the lab
- Include a complete answer key with brief explanations
- Appropriate difficulty for the grade level

Return as JSON with this exact structure:
{"title":"Quiz title","instructions":"Brief instructions for students","questions":[{"number":1,"question":"Question text","type":"multiple_choice or short_answer or constructed_response","options":["A) Option text","B) Option text","C) Option text","D) Option text"],"answer":"Correct answer","explanation":"Brief explanation"}]}`,
      parseResponse: parseJSONWithQuestions,
    },
  ];
}

function getPhilosophyForHistoryPrompts(lesson: LessonData): ResourcePromptConfig[] {
  const context = serializeLessonContext(lesson);

  return [
    // 1. Quote Collection & Context
    {
      type: "reading",
      title: "Quote Collection & Context",
      userPrompt: `You are creating a standalone student handout based on this lesson plan:

${context}

Create a Quote Collection & Context document for this Philosophy for History lesson. The document should present 6-10 historical quotes or brief source excerpts with supporting context so students can engage with them thoughtfully.

For each quote, include:
- Quote number and label
- The full quote text, clearly formatted
- Speaker/author name and role
- Date and source title
- A brief student-friendly context paragraph (1-3 sentences explaining who this person is, what was happening, and why they said/wrote this)
- 2-3 key vocabulary words with definitions if the language is challenging

At the end, include:
- A brief "How to Read Historical Quotes" tip section
- Reminders about considering who is speaking, what they value, and what they might leave out

The quotes should represent different perspectives and create opportunities for philosophical disagreement.

Return as JSON with this exact structure:
{"title":"Quote Collection title","subtitle":"The central philosophical question","sections":[{"heading":"Quote heading (e.g. Quote 1: Speaker Name)","content":"Full quote text with context, vocabulary, and source information"}]}`,
      parseResponse: parseJSON,
    },

    // 2. Philosophy Reflection Worksheet
    {
      type: "worksheet",
      title: "Philosophy Reflection Worksheet",
      userPrompt: `You are creating a standalone student worksheet based on this lesson plan:

${context}

Create a Philosophy Reflection Worksheet for this Philosophy for History lesson. The worksheet should guide students through the full arc: opening reflection, quote-by-quote analysis, synthesis, and final philosophical judgment.

The worksheet must include these sections:
1. Opening Reflection — the central philosophical question + sentence stem for initial thinking + 2-3 follow-up prompts
2. Quote Reflection (repeated for each quote) — for each quote, prompts asking:
   - What is this person saying?
   - Does this quote support, challenge, or complicate the central question?
   - What values, fears, or priorities are visible?
   - What does it reveal about costs, conflicts, or justifications?
   - Whose perspective is this? Who might disagree?
3. Sorting the Evidence — which quotes support one side vs. the other? Which complicate things?
4. Deeper Analysis — how do different people experience the same event differently? Did any quotes change your thinking?
5. Final Philosophical Judgment — a well-reasoned written response to the central question using evidence from the quotes

Include sentence starters throughout for students who need scaffolding.

Return as JSON with this exact structure:
{"sections":[{"heading":"Section title","instructions":"Brief instruction for students","prompts":["Specific prompt or question 1","Specific prompt or question 2"],"responseType":"lines or paragraph or list or table"}]}`,
      parseResponse: parseJSONWithSections,
    },

    // 3. Discussion Slides
    {
      type: "slides",
      title: "Discussion Slides",
      userPrompt: `You are creating a teacher presentation based on this lesson plan:

${context}

Create a slide deck (6-8 slides) for this Philosophy for History lesson. The slides should guide students through the philosophical inquiry and support class discussion.

Slide structure:
1. Title slide — Lesson title + the central philosophical question
2. Opening Reflection — the philosophical question in student-friendly language with the initial reflection prompt
3. Historical Context — brief background students need before reading the quotes
4-5. Key Quotes — 2-3 of the most provocative/important quotes displayed for class discussion (not all quotes — just the ones worth projecting)
6. Discussion Prompts — key analysis questions for small group or whole class discussion
7. Final Question — the philosophical judgment question students will write about
8. (Optional) Discussion norms or sentence starters slide

Keep text concise. The quotes should be large and readable when projected. Include teacher notes with discussion facilitation tips.

Return as JSON with this exact structure:
{"slides":[{"title":"Slide title","body":"Slide body text (keep concise, use bullet points with • character)","notes":"Teacher notes and talking points for this slide"}]}`,
      parseResponse: parseJSONWithSlides,
    },

    // 4. Quiz + Answer Key
    {
      type: "assessment",
      title: "Quiz + Answer Key",
      userPrompt: `You are creating a short assessment based on this lesson plan:

${context}

Create a short quiz (8-10 questions) that checks student understanding of the historical content, the philosophical question, and the perspectives represented in the quotes from this Philosophy for History lesson.

Requirements:
- Mix of question types: multiple choice (4-5), short answer (3-4), and one brief constructed response
- Multiple choice should test understanding of historical context and quote interpretation (not trivial recall)
- Short answer should require students to explain perspectives, values, or tensions in the quotes
- The constructed response should ask students to use evidence from specific quotes to support a philosophical-historical judgment
- Questions should be answerable based on what students learned during the lesson
- Include a complete answer key with brief explanations
- Appropriate difficulty for the grade level

Return as JSON with this exact structure:
{"title":"Quiz title","instructions":"Brief instructions for students","questions":[{"number":1,"question":"Question text","type":"multiple_choice or short_answer or constructed_response","options":["A) Option text","B) Option text","C) Option text","D) Option text"],"answer":"Correct answer","explanation":"Brief explanation"}]}`,
      parseResponse: parseJSONWithQuestions,
    },
  ];
}

function getSACPrompts(lesson: LessonData): ResourcePromptConfig[] {
  const context = serializeLessonContext(lesson);

  return [
    // 1. Source Set Document
    {
      type: "reading",
      title: "Source Set Document",
      userPrompt: `You are creating a standalone student source packet based on this lesson plan:

${context}

Create a Source Set Document for this Structured Academic Controversy. The document should present 4-6 sources clearly, organized so students can use them to build arguments on both sides of the controversy question.

For each source, include:
- Source number and title
- Source type (primary/secondary, speech/letter/data/image/etc.)
- Author/creator and date
- A brief student-friendly context paragraph (who created it, why, what was happening)
- Key vocabulary with brief definitions
- The source content or a clear description of what the source shows
- A note indicating which side(s) this source can support

At the end, include:
- A brief "How to Use Sources in a SAC" reference section
- Tips for building evidence-based arguments
- Reminders about finding evidence for BOTH sides

Return as JSON with this exact structure:
{"title":"Source Set title","subtitle":"The central controversy question","sections":[{"heading":"Source heading (e.g. Source 1: Title)","content":"Full source content including context, vocabulary, and the source text/description"}]}`,
      parseResponse: parseJSON,
    },

    // 2. SAC Worksheet
    {
      type: "worksheet",
      title: "SAC Worksheet",
      userPrompt: `You are creating a standalone student worksheet based on this lesson plan:

${context}

Create a SAC Worksheet for this Structured Academic Controversy that follows the standard SAC format. The worksheet should guide students through preparing arguments, listening to opposing views, switching sides, and finding common ground.

The worksheet must include these sections:
1. The Question — the central controversy question prominently displayed
2. Arguments In Favor — space for 3 arguments with source evidence (each: claim + source reference + explanation)
3. Arguments Against — space for 3 arguments with source evidence (each: claim + source reference + explanation)
4. Notes on Opposing Side's Arguments In Favor — space to record what the other side argues
5. Notes on Opposing Side's Arguments Against — space to record what the other side argues
6. Contentious Issues — what are the main points of disagreement? What makes this hard to resolve?
7. Possible Solutions — are there compromises or middle positions?
8. Common Ground Reached — what can both sides agree on? What shared conclusion did your group reach?

Include sentence starters for each section to help students structure their thinking.

Return as JSON with this exact structure:
{"sections":[{"heading":"Section title","instructions":"Brief instruction for students","prompts":["Specific prompt or question 1","Specific prompt or question 2"],"responseType":"lines or paragraph or list or table"}]}`,
      parseResponse: parseJSONWithSections,
    },

    // 3. SAC Intro Slides
    {
      type: "slides",
      title: "SAC Intro Slides",
      userPrompt: `You are creating a student-facing slide deck based on this lesson plan:

${context}

Create a short slide deck (5-7 slides) for this Structured Academic Controversy. The slides should introduce the controversy, explain the SAC process, and set expectations.

Slide structure:
1. Title slide — SAC title + the controversy question
2. The Question — the central controversy question prominently displayed with brief context
3. Historical Context — key background information students need
4. How a SAC Works — clear step-by-step overview of the process (prepare arguments, present, listen, switch sides, find common ground)
5. Your Task — what students will do today and what a successful SAC looks like
6. Discussion Norms — expectations for respectful, evidence-based debate
7. (Optional) Key terms or people to know

Keep text concise — these are projected slides. The SAC process slide is important: make it clear and visual.

Include teacher notes for each slide with talking points and timing suggestions.

Return as JSON with this exact structure:
{"slides":[{"title":"Slide title","body":"Slide body text (keep concise, use bullet points with • character)","notes":"Teacher notes and talking points for this slide"}]}`,
      parseResponse: parseJSONWithSlides,
    },

    // 4. Quiz + Answer Key
    {
      type: "assessment",
      title: "Quiz + Answer Key",
      userPrompt: `You are creating a short assessment based on this lesson plan:

${context}

Create a short quiz (8-10 questions) that checks student understanding of the historical content, the controversy question, argument quality, and the ability to consider multiple perspectives from this SAC.

Requirements:
- Mix of question types: multiple choice (4-5), short answer (3-4), and one brief constructed response
- Multiple choice should test historical content knowledge and understanding of both sides of the controversy
- Short answer should require students to explain the strongest arguments on each side or identify what evidence supports a position
- The constructed response should ask students to explain what common ground is possible or to evaluate which side has stronger evidence
- Questions should be answerable based on what students learned during the SAC
- Include a complete answer key with brief explanations
- Appropriate difficulty for the grade level

Return as JSON with this exact structure:
{"title":"Quiz title","instructions":"Brief instructions for students","questions":[{"number":1,"question":"Question text","type":"multiple_choice or short_answer or constructed_response","options":["A) Option text","B) Option text","C) Option text","D) Option text"],"answer":"Correct answer","explanation":"Brief explanation"}]}`,
      parseResponse: parseJSONWithQuestions,
    },
  ];
}
