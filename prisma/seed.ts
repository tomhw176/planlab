import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "postgresql://planlab:planlab@localhost:5432/planlab?schema=public",
});
const prisma = new PrismaClient({ adapter });

// BC Curriculum Standards for Social Studies Grades 6-12
const bcCurriculumData = [
  // Grade 6 Social Studies
  { subject: "Social Studies", gradeLevel: "6", category: "bigIdea", description: "Economic self-interest can be a significant cause of conflict among peoples and governments." },
  { subject: "Social Studies", gradeLevel: "6", category: "bigIdea", description: "Complex global problems require international cooperation to make progress toward solutions." },
  { subject: "Social Studies", gradeLevel: "6", category: "bigIdea", description: "Media sources can both positively and negatively affect our understanding of important events and issues." },
  { subject: "Social Studies", gradeLevel: "6", category: "competency", description: "Use Social Studies inquiry processes and skills to ask questions; gather, interpret, and analyze ideas; and communicate findings and decisions." },
  { subject: "Social Studies", gradeLevel: "6", category: "competency", description: "Assess the significance of people, places, events, or developments, and compare varying perspectives on their historical significance at particular times and places, and from group to group." },
  { subject: "Social Studies", gradeLevel: "6", category: "competency", description: "Construct arguments defending the significance of individuals/groups, places, events, or developments." },
  { subject: "Social Studies", gradeLevel: "6", category: "competency", description: "Make ethical judgments about events, decisions, or actions that consider the conditions of a particular time and place, and assess appropriate responses." },
  { subject: "Social Studies", gradeLevel: "6", category: "competency", description: "Explain different perspectives on past or present people, places, issues, or events, and compare the values, worldviews, and beliefs of human cultures and societies in different times and places." },
  { subject: "Social Studies", gradeLevel: "6", category: "content", description: "International cooperation and responses to global issues" },
  { subject: "Social Studies", gradeLevel: "6", category: "content", description: "Economic policies and resource management" },
  { subject: "Social Studies", gradeLevel: "6", category: "content", description: "Media and the influence of media in the modern world" },
  { subject: "Social Studies", gradeLevel: "6", category: "content", description: "Global poverty and inequality issues" },

  // Grade 7 Social Studies
  { subject: "Social Studies", gradeLevel: "7", category: "bigIdea", description: "Religious and cultural practices that emerged during this period have endured and continue to influence people." },
  { subject: "Social Studies", gradeLevel: "7", category: "bigIdea", description: "Increasingly complex societies required new systems of laws and government." },
  { subject: "Social Studies", gradeLevel: "7", category: "bigIdea", description: "Interactions and exchanges of resources and ideas between societies can have positive and negative consequences." },
  { subject: "Social Studies", gradeLevel: "7", category: "competency", description: "Use Social Studies inquiry processes and skills to ask questions; gather, interpret, and analyze ideas; and communicate findings and decisions." },
  { subject: "Social Studies", gradeLevel: "7", category: "competency", description: "Assess the significance of people, places, events, or developments at particular times and places." },
  { subject: "Social Studies", gradeLevel: "7", category: "competency", description: "Construct arguments defending the significance of individuals/groups, places, events, or developments." },
  { subject: "Social Studies", gradeLevel: "7", category: "competency", description: "Make ethical judgments about events, decisions, or actions." },
  { subject: "Social Studies", gradeLevel: "7", category: "competency", description: "Explain different perspectives on past or present people, places, issues, or events." },
  { subject: "Social Studies", gradeLevel: "7", category: "content", description: "Civilizations from ancient to medieval times (ca. 500-1500 CE)" },
  { subject: "Social Studies", gradeLevel: "7", category: "content", description: "Political, social, economic, and cultural changes in Europe and the rest of the world" },
  { subject: "Social Studies", gradeLevel: "7", category: "content", description: "Scientific, philosophical, and technological developments" },
  { subject: "Social Studies", gradeLevel: "7", category: "content", description: "Interactions and exchanges between civilizations" },

  // Grade 8 Social Studies
  { subject: "Social Studies", gradeLevel: "8", category: "bigIdea", description: "Contacts and conflicts between peoples stimulated significant cultural, social, political, and economic change." },
  { subject: "Social Studies", gradeLevel: "8", category: "bigIdea", description: "Human and environmental factors shape changes in population and living standards." },
  { subject: "Social Studies", gradeLevel: "8", category: "bigIdea", description: "Exploration, expansion, and colonization had varying consequences for different groups." },
  { subject: "Social Studies", gradeLevel: "8", category: "competency", description: "Use Social Studies inquiry processes and skills to ask questions; gather, interpret, and analyze ideas; and communicate findings and decisions." },
  { subject: "Social Studies", gradeLevel: "8", category: "competency", description: "Assess the significance of people, places, events, or developments." },
  { subject: "Social Studies", gradeLevel: "8", category: "competency", description: "Construct arguments defending the significance of individuals/groups, places, events, or developments." },
  { subject: "Social Studies", gradeLevel: "8", category: "competency", description: "Make ethical judgments about events, decisions, or actions." },
  { subject: "Social Studies", gradeLevel: "8", category: "content", description: "Exploration and colonization (ca. 1500-1800)" },
  { subject: "Social Studies", gradeLevel: "8", category: "content", description: "Changing ideas about the world — Renaissance, Reformation, Scientific Revolution, Enlightenment" },
  { subject: "Social Studies", gradeLevel: "8", category: "content", description: "Consequences of European contact for Indigenous peoples" },
  { subject: "Social Studies", gradeLevel: "8", category: "content", description: "Development of trade networks" },

  // Grade 9 Social Studies
  { subject: "Social Studies", gradeLevel: "9", category: "bigIdea", description: "Disparities in power alter the balance of relationships between individuals and between societies." },
  { subject: "Social Studies", gradeLevel: "9", category: "bigIdea", description: "Collective identity is constructed and can change over time." },
  { subject: "Social Studies", gradeLevel: "9", category: "bigIdea", description: "The physical environment influences the nature of political, social, and economic change." },
  { subject: "Social Studies", gradeLevel: "9", category: "competency", description: "Use Social Studies inquiry processes and skills to ask questions; gather, interpret, and analyze ideas; and communicate findings and decisions." },
  { subject: "Social Studies", gradeLevel: "9", category: "competency", description: "Assess the significance of people, places, events, or developments, and compare varying perspectives on their historical significance." },
  { subject: "Social Studies", gradeLevel: "9", category: "competency", description: "Explain and infer different perspectives on past or present people, places, issues, or events." },
  { subject: "Social Studies", gradeLevel: "9", category: "content", description: "Political, social, economic, and cultural revolutions (ca. 1750-1919)" },
  { subject: "Social Studies", gradeLevel: "9", category: "content", description: "Imperialism and colonialism, and their continuing effects" },
  { subject: "Social Studies", gradeLevel: "9", category: "content", description: "Global demographic shifts including urbanization, migration, and population growth" },
  { subject: "Social Studies", gradeLevel: "9", category: "content", description: "Nationalism and the development of modern nation-states" },

  // Grade 10 Social Studies
  { subject: "Social Studies", gradeLevel: "10", category: "bigIdea", description: "Global and regional conflicts have been a powerful force in shaping our contemporary world and identities." },
  { subject: "Social Studies", gradeLevel: "10", category: "bigIdea", description: "The development of political institutions is influenced by economic, social, ideological, and geographic factors." },
  { subject: "Social Studies", gradeLevel: "10", category: "bigIdea", description: "Historical and contemporary injustices challenge the narrative and identity of Canada as an inclusive, multicultural society." },
  { subject: "Social Studies", gradeLevel: "10", category: "competency", description: "Use Social Studies inquiry processes and skills to ask questions; gather, interpret, and analyze ideas; and communicate findings and decisions." },
  { subject: "Social Studies", gradeLevel: "10", category: "competency", description: "Determine what is fair or just response to a particular ethical question." },
  { subject: "Social Studies", gradeLevel: "10", category: "competency", description: "Make reasoned ethical judgments about actions in the past and present." },
  { subject: "Social Studies", gradeLevel: "10", category: "content", description: "Global conflicts (World War I, World War II, and selected conflicts post 1945)" },
  { subject: "Social Studies", gradeLevel: "10", category: "content", description: "Canadian autonomy and identity" },
  { subject: "Social Studies", gradeLevel: "10", category: "content", description: "Human rights and freedoms in Canada and internationally" },
  { subject: "Social Studies", gradeLevel: "10", category: "content", description: "Genocide and mass atrocities" },

  // Grade 11 Social Studies (Explorations in Social Studies)
  { subject: "Social Studies", gradeLevel: "11", category: "bigIdea", description: "Emerging ideas and ideologies profoundly influence societies and events." },
  { subject: "Social Studies", gradeLevel: "11", category: "bigIdea", description: "The physical environment influences the nature of political, social, and economic change." },
  { subject: "Social Studies", gradeLevel: "11", category: "bigIdea", description: "Disparities in power alter the balance of relationships between individuals and between societies." },
  { subject: "Social Studies", gradeLevel: "11", category: "competency", description: "Assess and compare the significance of people, places, events, or developments, and compare varying perspectives." },
  { subject: "Social Studies", gradeLevel: "11", category: "competency", description: "Analyze cause and consequence and make inferences about the past and present." },
  { subject: "Social Studies", gradeLevel: "11", category: "competency", description: "Explain different perspectives on past or present people, places, issues, or events by considering prevailing norms, values, worldviews, and beliefs." },
  { subject: "Social Studies", gradeLevel: "11", category: "content", description: "Political, social, economic, and cultural changes in the 20th and 21st centuries" },
  { subject: "Social Studies", gradeLevel: "11", category: "content", description: "Advocacy for human rights, including labour, women's, LGBTQ+, and Indigenous rights" },
  { subject: "Social Studies", gradeLevel: "11", category: "content", description: "Environmental and climate change challenges" },
  { subject: "Social Studies", gradeLevel: "11", category: "content", description: "Globalization and its consequences" },

  // Grade 12 Social Studies (20th Century World History)
  { subject: "Social Studies", gradeLevel: "12", category: "bigIdea", description: "Nationalist movements can unite people or create conflict and division." },
  { subject: "Social Studies", gradeLevel: "12", category: "bigIdea", description: "The breakdown of long-standing empires and resulting power vacuums led to new political and social structures." },
  { subject: "Social Studies", gradeLevel: "12", category: "bigIdea", description: "Global conflicts have significant and lasting consequences for peoples and states." },
  { subject: "Social Studies", gradeLevel: "12", category: "competency", description: "Assess the significance of people, places, events, or developments over short- and long-term time frames." },
  { subject: "Social Studies", gradeLevel: "12", category: "competency", description: "Compare and contrast continuities and changes for different groups across different time periods." },
  { subject: "Social Studies", gradeLevel: "12", category: "competency", description: "Assess how prevailing conditions and the actions of individuals or groups influence events, decisions, or developments." },
  { subject: "Social Studies", gradeLevel: "12", category: "content", description: "Global conflicts — origins, course, and consequences of World War I, World War II, and the Cold War" },
  { subject: "Social Studies", gradeLevel: "12", category: "content", description: "Post-colonial independence movements and their consequences" },
  { subject: "Social Studies", gradeLevel: "12", category: "content", description: "20th-century genocides, including the Holocaust, and movements for social justice" },
  { subject: "Social Studies", gradeLevel: "12", category: "content", description: "Political systems and ideologies — democracy, communism, fascism, authoritarianism" },
];

// Default lesson templates
const defaultTemplates = [
  {
    name: "Historical Decision-Making",
    description: "Students take the place of a historical figure, learn about their situation, make a decision, then learn what actually happened.",
    structure: {
      icon: "Scale",
      color: "#6366f1",
      sections: [
        "Set the scene — introduce the historical context and the person",
        "Present the dilemma — what decision did they face?",
        "Student deliberation — small group or individual analysis",
        "Students make and defend their decision",
        "Reveal the historical outcome",
        "Debrief — compare decisions, discuss consequences",
      ],
      defaultSliders: {
        prepDemand: 4,
        teacherDirection: 3,
        collaboration: 4,
        assessmentEvidence: 3,
        managementComplexity: 3,
      },
      bestUseCases: [
        "Moral dilemmas & tough choices",
        "Cause & consequence analysis",
        "Perspective-taking & empathy",
      ],
    },
    requiredFields: [
      { field: "topic", label: "Historical Topic / Event", type: "text", required: true, placeholder: "e.g. Should Truman drop the atomic bomb?" },
      { field: "grade", label: "Grade Level", type: "select", options: ["6","7","8","9","10","11","12"], useDefault: "gradeLevel" },
      { field: "students", label: "Number of Students", type: "number", default: 30, useDefault: "numStudents" },
      { field: "duration", label: "Lesson Duration (min)", type: "number", default: 60, useDefault: "lessonDuration" },
      { field: "context", label: "Additional Context (optional)", type: "textarea", required: false, placeholder: "Anything else the AI should know..." },
    ],
    promptTemplate: `You are an expert high school history teacher and curriculum designer. Your task is to generate a complete, high-quality "Historical Decision-Making Activity" lesson.

LESSON CONTEXT:
- Grade level: {{grade}}
- Number of students: {{students}}
- Class time: {{duration}} minutes
- Topic: {{topic}}
{{#context}}Additional teacher notes: {{context}}{{/context}}
{{#unitTitle}}Unit: {{unitTitle}}{{/unitTitle}}
{{#courseName}}Course: {{courseName}}{{/courseName}}
{{#priorLessons}}Prior lessons in this unit: {{priorLessons}}{{/priorLessons}}

Use whatever relevant context is available, such as unit title, lesson topic, learning objectives, curricular competencies, content standards, prior lessons, student age/grade, class time, skills being emphasized, and teacher notes or planning context.

If some details are missing, make reasonable instructional and historical assumptions. Briefly state those assumptions at the beginning. Do not ask follow-up questions unless the task is impossible without them.

The activity should be generated in one complete response.

## Purpose of the Template
Create a historically rigorous, engaging classroom activity in which students must make a difficult decision from within a historical context. The activity should require students to weigh competing goals, pressures, limitations, perspectives, and possible consequences.

The final lesson should feel:
- intellectually serious
- historically grounded
- dramatic and engaging
- practical for real classroom use
- aligned to the available learning goals

## Scenario Selection
Select the decision-making scenario that best fits the available lesson or unit context. Do not simply list options unless alternatives are especially valuable.

Possible scenario types include:
1. Strictly Historical — students take the perspective of a real historical person making a decision they actually faced.
2. Historical Knowledge for a Contemporary Decision — students take the role of a present-day decision-maker and use historical case studies to guide a current decision.
3. Another historically appropriate format — if another model better serves the lesson goals, use it and explain why.

Possible categories of decision-makers include heads of state, activists, reformers, philosophers/political thinkers, business leaders, school/community leaders, ordinary people shaped by larger systems, or any other historically appropriate role.

Choose the strongest option based on the instructional goals and topic.

## Design Principles
The generated activity should:
- align tightly to the lesson or unit goals
- reflect real historical tensions, uncertainty, and constraints
- emphasize historical thinking where appropriate (cause and consequence, perspective, evidence, continuity and change, ethical judgment, significance)
- avoid oversimplified "right answer" framing
- avoid presentism
- make clear what the historical actor could realistically know at the time
- distinguish between individual agency and structural limits
- avoid false neutrality when the topic involves injustice, oppression, colonization, slavery, or other power imbalances
- include appropriate scaffolds and supports
- be classroom-ready and concrete

## Output Requirements
Generate the lesson using ALL of the following sections. Each section must be thorough and detailed.

# 1. Activity Overview
Title, grade level, course/unit connection, estimated time needed, brief summary of what students do, and why this is the best decision-making scenario for this lesson/unit.

# 2. Chosen Decision-Making Scenario
Who the decision-maker is, what decision they face, why it matters historically, and why this perspective is effective for student learning.

# 3. Historical Background for the Teacher
Concise but rich background: who is this person, what background knowledge students need, historical context, groups/stakeholders involved, main stakes and tensions, constraints on the decision-maker, what they would realistically know at the time, and what they would not yet know.

# 4. Timeline of Key Events
Short focused timeline of events most relevant to the decision. Each entry: date, what happened, why it matters.

# 5. Student Intro Slide Overview
Brief student-friendly overview organized under What, Where, When, Why. Concise enough to project on a slide.

# 6. Group Roles
5 roles for student groups. One must be the main decision-maker. Others represent competing perspectives/priorities. Each role includes: who they are, what they want, what they fear, what bias/priority/instinct they bring. Must still work with only 3 students.

# 7. Main Student Reading / Briefing Document
A one-page student briefing (letter, memo, advisory brief, report, or message) that summarizes the situation vividly, includes key historical information, communicates urgency/pressure/stakes, shows competing concerns without flattening moral realities, feels authentic, and ends with a clear decision task.

# 8. Decision Options
4 to 6 possible options including "Other." Each includes: what it involves, one likely benefit, one likely risk/cost/downside. Plausible and historically grounded.

# 9. Hook Ideas
2 to 4 short, quick, engaging hook ideas tightly connected to the dilemma.

# 10. Student Worksheet / Decision Guide
Scaffolded worksheet with: Context, Key groups involved, Limitations, Understanding your options, Overall goal, Initial decision, Anticipating unintended consequences, Adjustments/safeguards, Action plan, Justification.

# 11. Consolidation / Debrief Options
Several strong ways to consolidate learning (mix of oral, written, collaborative). Each briefly explains what it helps students understand or practice.

# 12. What Actually Happened
Short explanation of what actually happened historically, plus 2-3 ways to reveal/teach this after the activity so students can compare their decision, the historical choice, and the actual consequences.

# 13. Short Quiz
Short quiz checking understanding of historical content and decision-making process. Include answer key. Mix of factual understanding and historical reasoning.

# 14. Teacher Notes for Improvement
Suggestions for: scaffolding further, differentiating, strengthening UDL, making it more engaging without undermining rigor, extending into a broader lesson/unit.

# 15. Alternative Options
1-2 alternative decision-making scenarios that could also work, with explanation of why they were not chosen as the main version.

## CRITICAL: JSON Output Format
After generating all sections above, you MUST also return a JSON object that maps the content into these lesson plan fields. The JSON must appear at the end of your response, wrapped in a code block.

Return JSON with these fields:
{"hook":"[Section 9 hook ideas, formatted with markdown]","learningTarget":"[A clear learning target derived from the scenario and curriculum alignment]","lessonPurpose":"[Section 1 Activity Overview — summary of the activity and why this scenario was chosen]","materialsNeeded":"[Compiled list: briefing document, role cards, decision worksheet, timeline handout, intro slide, quiz — reference what needs to be printed/prepared]","activities":[{"name":"[Activity name]","duration":"[X min]","description":"[Detailed description of what happens in this phase]"}],"closure":"[Section 11 consolidation/debrief options + Section 12 what actually happened and reveal strategies]","assessment":"[Section 13 quiz with answer key + Section 10 worksheet description/key prompts]","scaffolds":"[Section 14 teacher notes on scaffolding, differentiation, UDL]","extension":"[Section 14 extension ideas + Section 15 alternative scenarios]","notes":"[Section 3 teacher background + Section 4 timeline + Section 6 group roles summary + Section 8 decision options summary]","curriculumConnection":{"bigIdea":"[Relevant BC curriculum big idea]","competencyFocus":"[Relevant curricular competency]","contentConnection":"[Relevant content standard]"}}

The activities array should represent the main lesson flow (typically 5-7 activities covering: hook/intro, context setting, briefing document reading, group deliberation, decision-making and justification, historical reveal, debrief).

## Style Requirements
- Write with the judgment and clarity of an excellent history teacher.
- Be specific, concrete, and historically grounded.
- Make materials ready to use or easy to adapt.
- Avoid vague suggestions and unnecessary filler.
- Prioritize depth, clarity, and classroom practicality.
- When historical uncertainty exists, reflect that honestly.`,
  },
  {
    name: "Digital Escape Room",
    description: "Students solve a series of puzzles and challenges using historical content to 'escape' or unlock the final answer.",
    structure: {
      icon: "KeyRound",
      color: "#f59e0b",
      sections: [
        "Introduction narrative — set the scenario",
        "Puzzle 1 — content-based challenge",
        "Puzzle 2 — source analysis challenge",
        "Puzzle 3 — critical thinking challenge",
        "Final lock/answer — synthesize all clues",
        "Debrief and discussion",
      ],
      defaultSliders: {
        prepDemand: 4,
        teacherDirection: 2,
        collaboration: 4,
        assessmentEvidence: 3,
        managementComplexity: 4,
      },
      bestUseCases: [
        "Content review & reinforcement",
        "Gamified engagement",
        "Collaborative problem-solving",
      ],
    },
    requiredFields: [
      { field: "topic", label: "Topic / Content Focus", type: "text", required: true, placeholder: "e.g. The French Revolution" },
      { field: "grade", label: "Grade Level", type: "select", options: ["6","7","8","9","10","11","12"], useDefault: "gradeLevel" },
      { field: "students", label: "Number of Students", type: "number", default: 30, useDefault: "numStudents" },
      { field: "duration", label: "Lesson Duration (min)", type: "number", default: 60, useDefault: "lessonDuration" },
      { field: "context", label: "Additional Context (optional)", type: "textarea", required: false, placeholder: "Anything else the AI should know..." },
    ],
    promptTemplate: `Create a Digital Escape Room lesson for Grade {{grade}} Social Studies ({{students}} students, {{duration}} minutes).

Topic: {{topic}}
{{#context}}Additional context: {{context}}{{/context}}

TEMPLATE STRUCTURE:
Students solve a series of puzzles and challenges using historical content to 'escape' or unlock the final answer. Each puzzle tests different skills: content knowledge, source analysis, and critical thinking.

The lesson should follow this flow:
1. Introduction narrative — set the scenario and hook students
2. Puzzle 1 — content-based challenge
3. Puzzle 2 — source analysis challenge
4. Puzzle 3 — critical thinking challenge
5. Final lock/answer — synthesize all clues
6. Debrief and discussion

Generate a complete, practical lesson plan. Return as JSON with these fields:
{"hook":"...","learningTarget":"...","lessonPurpose":"...","materialsNeeded":"...","activities":[{"name":"...","duration":"X","description":"..."}],"closure":"...","assessment":"...","scaffolds":"...","extension":"...","curriculumConnection":{"bigIdea":"...","competencyFocus":"...","contentConnection":"..."}}`,
  },
  {
    name: "Connecting History to Present",
    description: "Students explore a historical event or pattern and draw connections to current events or issues.",
    structure: {
      icon: "ArrowRightLeft",
      color: "#10b981",
      sections: [
        "Hook — present a current event or issue",
        "Historical context — explore the relevant historical parallel",
        "Analysis — identify patterns, causes, and consequences",
        "Comparison — create a structured comparison (Venn diagram, T-chart)",
        "Discussion — what can history teach us about this issue?",
        "Reflection — student written response",
      ],
      defaultSliders: {
        prepDemand: 4,
        teacherDirection: 3,
        collaboration: 3,
        assessmentEvidence: 4,
        managementComplexity: 3,
      },
      bestUseCases: [
        "Past-present connections",
        "Pattern & analogy analysis",
        "Current events relevance",
      ],
    },
    requiredFields: [
      { field: "topic", label: "Historical Event & Modern Connection", type: "text", required: true, placeholder: "e.g. Residential schools → modern reconciliation efforts" },
      { field: "grade", label: "Grade Level", type: "select", options: ["6","7","8","9","10","11","12"], useDefault: "gradeLevel" },
      { field: "students", label: "Number of Students", type: "number", default: 30, useDefault: "numStudents" },
      { field: "duration", label: "Lesson Duration (min)", type: "number", default: 60, useDefault: "lessonDuration" },
      { field: "context", label: "Additional Context (optional)", type: "textarea", required: false, placeholder: "Anything else the AI should know..." },
    ],
    promptTemplate: `Create a Connecting History to Present lesson for Grade {{grade}} Social Studies ({{students}} students, {{duration}} minutes).

Topic: {{topic}}
{{#context}}Additional context: {{context}}{{/context}}

TEMPLATE STRUCTURE:
Students explore a historical event or pattern and draw explicit connections to current events or issues. They analyze parallels, identify patterns, and reflect on what history can teach us.

The lesson should follow this flow:
1. Hook — present a current event or issue that connects to the historical topic
2. Historical context — explore the relevant historical parallel
3. Analysis — identify patterns, causes, and consequences
4. Comparison — structured comparison activity (Venn diagram, T-chart, etc.)
5. Discussion — what can history teach us about this issue?
6. Reflection — student written response

Generate a complete, practical lesson plan. Return as JSON with these fields:
{"hook":"...","learningTarget":"...","lessonPurpose":"...","materialsNeeded":"...","activities":[{"name":"...","duration":"X","description":"..."}],"closure":"...","assessment":"...","scaffolds":"...","extension":"...","curriculumConnection":{"bigIdea":"...","competencyFocus":"...","contentConnection":"..."}}`,
  },
  {
    name: "Direct Instruction",
    description: "Traditional teacher-led lesson with structured note-taking, examples, and guided practice.",
    structure: {
      icon: "Presentation",
      color: "#8b5cf6",
      sections: [
        "Bell ringer / warm-up activity",
        "Introduction of key concepts and vocabulary",
        "Guided notes or lecture with visuals",
        "Check for understanding (formative)",
        "Guided practice",
        "Independent practice or exit ticket",
      ],
      defaultSliders: {
        prepDemand: 3,
        teacherDirection: 5,
        collaboration: 2,
        assessmentEvidence: 3,
        managementComplexity: 2,
      },
      bestUseCases: [
        "New content introduction",
        "Complex concept explanation",
        "Structured note-taking",
      ],
    },
    requiredFields: [
      { field: "topic", label: "Lesson Topic / Content", type: "text", required: true, placeholder: "e.g. Causes of World War I" },
      { field: "grade", label: "Grade Level", type: "select", options: ["6","7","8","9","10","11","12"], useDefault: "gradeLevel" },
      { field: "students", label: "Number of Students", type: "number", default: 30, useDefault: "numStudents" },
      { field: "duration", label: "Lesson Duration (min)", type: "number", default: 60, useDefault: "lessonDuration" },
      { field: "context", label: "Additional Context (optional)", type: "textarea", required: false, placeholder: "Anything else the AI should know..." },
    ],
    promptTemplate: `Create a Direct Instruction lesson for Grade {{grade}} Social Studies ({{students}} students, {{duration}} minutes).

Topic: {{topic}}
{{#context}}Additional context: {{context}}{{/context}}

TEMPLATE STRUCTURE:
Teacher-led lesson with structured note-taking, clear examples, and guided practice. Focus on explicit teaching of key concepts and vocabulary.

The lesson should follow this flow:
1. Bell ringer / warm-up activity
2. Introduction of key concepts and vocabulary
3. Guided notes or lecture with visuals
4. Check for understanding (formative)
5. Guided practice
6. Independent practice or exit ticket

Generate a complete, practical lesson plan. Return as JSON with these fields:
{"hook":"...","learningTarget":"...","lessonPurpose":"...","materialsNeeded":"...","activities":[{"name":"...","duration":"X","description":"..."}],"closure":"...","assessment":"...","scaffolds":"...","extension":"...","curriculumConnection":{"bigIdea":"...","competencyFocus":"...","contentConnection":"..."}}`,
  },
  {
    name: "Socratic Seminar",
    description: "Student-led discussion using open-ended questions about a text, source, or topic.",
    structure: {
      icon: "MessagesSquare",
      color: "#06b6d4",
      sections: [
        "Pre-reading and preparation (done before class)",
        "Review seminar norms and expectations",
        "Opening question — broad, text-based",
        "Core questions — deeper analysis and interpretation",
        "Closing question — personal connection or modern relevance",
        "Written reflection on the discussion",
      ],
      defaultSliders: {
        prepDemand: 3,
        teacherDirection: 2,
        collaboration: 5,
        assessmentEvidence: 4,
        managementComplexity: 3,
      },
      bestUseCases: [
        "Text-based deep discussion",
        "Student-led inquiry",
        "Interpretive & evaluative thinking",
      ],
    },
    requiredFields: [
      { field: "topic", label: "Discussion Topic / Text", type: "text", required: true, placeholder: "e.g. Excerpts from the UN Declaration of Human Rights" },
      { field: "grade", label: "Grade Level", type: "select", options: ["6","7","8","9","10","11","12"], useDefault: "gradeLevel" },
      { field: "students", label: "Number of Students", type: "number", default: 30, useDefault: "numStudents" },
      { field: "duration", label: "Lesson Duration (min)", type: "number", default: 60, useDefault: "lessonDuration" },
      { field: "context", label: "Additional Context (optional)", type: "textarea", required: false, placeholder: "Anything else the AI should know..." },
    ],
    promptTemplate: `Create a Socratic Seminar lesson for Grade {{grade}} Social Studies ({{students}} students, {{duration}} minutes).

Topic/Text: {{topic}}
{{#context}}Additional context: {{context}}{{/context}}

TEMPLATE STRUCTURE:
Student-led discussion using open-ended questions. Students engage with a text or source, discuss in a structured seminar format, and reflect on the discussion.

The lesson should follow this flow:
1. Pre-reading and preparation (homework or beginning of class)
2. Review seminar norms and expectations
3. Opening question — broad, text-based
4. Core questions — deeper analysis and interpretation
5. Closing question — personal connection or modern relevance
6. Written reflection on the discussion

Generate a complete, practical lesson plan. Return as JSON with these fields:
{"hook":"...","learningTarget":"...","lessonPurpose":"...","materialsNeeded":"...","activities":[{"name":"...","duration":"X","description":"..."}],"closure":"...","assessment":"...","scaffolds":"...","extension":"...","curriculumConnection":{"bigIdea":"...","competencyFocus":"...","contentConnection":"..."}}`,
  },
  {
    name: "Document-Based Inquiry",
    description: "Students analyze primary and secondary sources to build an evidence-based argument.",
    structure: {
      icon: "FileSearch",
      color: "#ef4444",
      sections: [
        "Introduce the inquiry question",
        "Model source analysis using one document",
        "Students analyze documents in groups (sourcing, contextualization, corroboration)",
        "Evidence gathering and note-taking",
        "Construct an argument with evidence",
        "Share and discuss conclusions",
      ],
      defaultSliders: {
        prepDemand: 4,
        teacherDirection: 3,
        collaboration: 3,
        assessmentEvidence: 4,
        managementComplexity: 3,
      },
      bestUseCases: [
        "Evidence-based argumentation",
        "Source analysis skills",
        "Historical thinking practice",
      ],
    },
    requiredFields: [
      { field: "topic", label: "Inquiry Question / Topic", type: "text", required: true, placeholder: "e.g. Was the Treaty of Versailles fair?" },
      { field: "grade", label: "Grade Level", type: "select", options: ["6","7","8","9","10","11","12"], useDefault: "gradeLevel" },
      { field: "students", label: "Number of Students", type: "number", default: 30, useDefault: "numStudents" },
      { field: "duration", label: "Lesson Duration (min)", type: "number", default: 60, useDefault: "lessonDuration" },
      { field: "context", label: "Additional Context (optional)", type: "textarea", required: false, placeholder: "Anything else the AI should know..." },
    ],
    promptTemplate: `Create a Document-Based Inquiry lesson for Grade {{grade}} Social Studies ({{students}} students, {{duration}} minutes).

Inquiry Question/Topic: {{topic}}
{{#context}}Additional context: {{context}}{{/context}}

TEMPLATE STRUCTURE:
Students analyze primary and secondary sources to build an evidence-based argument. They practice sourcing, contextualization, and corroboration skills.

The lesson should follow this flow:
1. Introduce the inquiry question
2. Model source analysis using one document
3. Students analyze documents in groups (sourcing, contextualization, corroboration)
4. Evidence gathering and note-taking
5. Construct an argument with evidence
6. Share and discuss conclusions

Generate a complete, practical lesson plan. Return as JSON with these fields:
{"hook":"...","learningTarget":"...","lessonPurpose":"...","materialsNeeded":"...","activities":[{"name":"...","duration":"X","description":"..."}],"closure":"...","assessment":"...","scaffolds":"...","extension":"...","curriculumConnection":{"bigIdea":"...","competencyFocus":"...","contentConnection":"..."}}`,
  },
  {
    name: "History Lab",
    description: "Students investigate a historical question using a set of sources, analyze evidence, compare perspectives, and build a defensible conclusion.",
    structure: {
      icon: "FlaskConical",
      color: "#0ea5e9",
      sections: [
        "History Lab Overview — title, connection, summary",
        "Inquiry Question — main question and alternatives",
        "Authentic Purpose / Student Role",
        "Source Set — 3 to 6 sources with analysis",
        "Source-by-Source Teacher Support (context, language, SCOAPS)",
        "Student Worksheet / Investigation Guide",
        "Teacher Answer Guide / Likely Findings",
        "Consolidation / Debrief Options",
        "Short Assessment / Check for Understanding",
        "Teacher Notes for Improvement",
        "Implementation Reminders",
      ],
      defaultSliders: {
        prepDemand: 4,
        teacherDirection: 3,
        collaboration: 3,
        assessmentEvidence: 4,
        managementComplexity: 3,
      },
      bestUseCases: [
        "Inquiry-based investigation",
        "Source comparison & reliability",
        "Building defensible conclusions",
      ],
    },
    requiredFields: [
      { field: "topic", label: "Historical Topic / Inquiry Question", type: "text", required: true, placeholder: "e.g. Why did the Roman Empire fall?" },
      { field: "grade", label: "Grade Level", type: "select", options: ["6","7","8","9","10","11","12"], useDefault: "gradeLevel" },
      { field: "students", label: "Number of Students", type: "number", default: 30, useDefault: "numStudents" },
      { field: "duration", label: "Lesson Duration (min)", type: "number", default: 60, useDefault: "lessonDuration" },
      { field: "context", label: "Additional Context (optional)", type: "textarea", required: false, placeholder: "Anything else the AI should know..." },
    ],
    promptTemplate: `You are an expert high school history teacher and curriculum designer. Your task is to generate a complete, high-quality "History Lab" lesson.

LESSON CONTEXT:
- Grade level: {{grade}}
- Number of students: {{students}}
- Class time: {{duration}} minutes
- Topic: {{topic}}
{{#context}}Additional teacher notes: {{context}}{{/context}}
{{#unitTitle}}Unit: {{unitTitle}}{{/unitTitle}}
{{#courseName}}Course: {{courseName}}{{/courseName}}
{{#priorLessons}}Prior lessons in this unit: {{priorLessons}}{{/priorLessons}}

Use whatever relevant context is available, such as unit title, lesson topic, learning objectives, curricular competencies, content standards, prior lessons, student age/grade, class time, skills being emphasized, and teacher notes or planning context.

If some details are missing, make reasonable instructional and historical assumptions. Briefly state those assumptions at the beginning. Do not ask follow-up questions unless the task is impossible without them.

Generate the activity in one complete response.

## Purpose of the Template
Create a historically rigorous, engaging inquiry-based lesson in which students investigate a historical question using a set of sources. The lab should help students think like historians by interpreting evidence, comparing perspectives, judging reliability, identifying gaps, and building a defensible conclusion.

The final lesson should feel:
- intellectually serious
- student-friendly
- engaging and purposeful
- practical for real classroom use
- aligned to the available learning goals

## Source Handling Rules
If actual sources are already available in the planning context, use them.
If sources are not available, propose a strong set of 3 to 6 sources that would support the lab. These should include a useful mix where possible, such as:
- primary sources
- secondary sources
- images
- maps
- graphs or charts
- artifacts
- oral histories
- virtual tours
- excerpts from speeches, letters, diaries, interviews, laws, or news reports
When suggested rather than provided, clearly label them as "Suggested Sources."
If actual uploaded or linked sources are available, analyze each source directly. If not, generate the rest of the lab using the proposed source set.

## Inquiry Question Selection
Select the strongest inquiry question for the lesson based on the available context. Do not simply list many options unless brief alternatives would be useful.

The inquiry question should be:
- interesting to students
- written in student-friendly language
- debatable or answerable through reasoning and evidence
- well-suited to source analysis

If helpful, choose a more open-ended or more closed question depending on the likely student needs and the complexity of the topic.

## Design Principles
The generated lesson should:
- align tightly to the lesson or unit goals
- emphasize historical thinking, including evidence, perspective, cause and consequence, continuity and change, significance, or ethical judgment where appropriate
- teach students to compare sources rather than treat all sources as equally trustworthy
- avoid oversimplified "find the one right answer" framing
- avoid presentism
- reflect historical complexity in student-accessible language
- include appropriate scaffolds and supports
- be classroom-ready and concrete
- prefer depth and usability over excessive length; generate something ambitious but realistically teachable
- avoid false neutrality when the topic involves injustice, oppression, colonization, slavery, or other power imbalances
The source set should not merely provide information; it should create opportunities for students to compare perspectives, identify contradictions, evaluate reliability, and notice what is missing.

## Output Requirements
Generate the lesson using ALL of the following sections. Each section must be thorough and detailed.

# 1. History Lab Overview
Include:
- Title of the lab
- Grade level
- Course / unit connection
- Estimated time needed
- Brief summary of what students do
- Why this lab format is effective for this lesson or unit

# 2. Inquiry Question
Provide:
- the main inquiry question
- a brief explanation of why it is the strongest fit for the topic and learning goals
- 1 to 2 alternative inquiry questions that could also work

# 3. Authentic Purpose / Student Role
Create an authentic purpose for the investigation.
Explain:
- what role students are taking on, if any
- who they are investigating for
- why their conclusion matters
- how this purpose increases engagement or relevance
Possible roles might include historian, journalist, museum curator, advisor, documentary researcher, prosecutor, policy analyst, community educator, or another appropriate role.

# 4. Source Set
If sources are already available, organize and present them clearly.
If not, propose a strong set of 3 to 6 suggested sources.
For each source, include:
- source title or description
- source type
- whether it is primary or secondary
- what perspective or information it contributes
- why it is valuable for answering the inquiry question
Aim for a source set with meaningful variety and opportunities for comparison, contradiction, corroboration, and reliability analysis.

# 5. Source-by-Source Teacher Support
For each source, provide the following:
## A. Student Context / Source Intro
Give any background information students may need in order to make sense of the source.
If the source is difficult, provide just enough context to support understanding without giving away the full interpretation.
## B. Language Support
Identify confusing, difficult, or domain-specific words, phrases, or references.
Provide brief definitions or explanations that would help students access the source.
## C. Easier Version, if Needed
If the source would likely be too difficult for many students, provide a simplified side-by-side version that preserves the meaning while making the language more accessible.
## D. SCOAPS Analysis
Provide a detailed source analysis using these categories:
- Subject: What is the source mainly about? What is its focus?
- Critique: Who at the time might disagree with, criticize, or challenge this source?
- Occasion: What historical context or events help explain this source?
- Audience: Who was the intended audience?
- Purpose: What did the author, creator, or institution want the audience to think, feel, or do?
- Speaker: Who created it, and what point of view, position, or possible bias do they bring?

# 6. Student Worksheet / Investigation Guide
Create a scaffolded worksheet for students that helps them move from curiosity to claim.
The worksheet should include:
- Investigation question
- What I already know
- My first hypothesis
- Source tracker for each source:
  - source title / type
  - who created it
  - when it was created
  - what it says or shows
  - what makes it useful
  - what might limit its reliability
  - strongest piece of evidence from it
- Comparing sources:
  - Where do sources agree?
  - Where do they disagree?
  - Which differences matter most?
- Evaluating reliability:
  - Which source is most trustworthy for this question, and why?
  - Which source should be used most carefully, and why?
- Gaps in the evidence:
  - What do we still not know?
  - What source would help us next?
- Final conclusion:
  - thesis
  - evidence from at least two sources
  - explanation of how the evidence supports the conclusion
Where appropriate, include sentence starters, tables, or graphic organizer structures.

# 7. Teacher Answer Guide / Likely Findings
Provide a teacher-facing section that outlines:
- the strongest likely conclusions students may reach
- key evidence from the source set
- likely misconceptions
- places where students may overgeneralize, misread, or misuse a source
- how to respond if students reach different but defensible conclusions

# 8. Consolidation / Debrief Options
Suggest several strong ways students can consolidate learning after the lab.
Include a mix of:
- discussion-based options
- written options
- creative or performance-based options
- short and longer options
For each, explain what it helps students practice or understand.

# 9. Short Assessment / Check for Understanding
Create a short assessment to check understanding of:
- the historical content
- the inquiry question
- source interpretation and reliability
Include an answer key or teacher notes.

# 10. Teacher Notes for Improvement
Provide suggestions under these headings:
- How to scaffold it further
- How to differentiate it
- How to strengthen UDL
- How to make it more engaging without undermining rigor
- How to extend it into a broader lesson or unit

# 11. Implementation Reminders
Provide practical reminders for running the history lab well, including atmosphere, pacing, transitions, and motivation.
Include ideas such as:
- using detective-style framing or atmosphere
- optional background music
- small recognition or awards
- norms for evidence-based discussion
- strategies for keeping students focused on the inquiry question rather than just collecting facts

## CRITICAL: JSON Output Format
After generating all sections above, you MUST also return a JSON object that maps the content into these lesson plan fields. The JSON must appear at the end of your response, wrapped in a code block.

Return JSON with these fields:
{"hook":"[Section 3 Authentic Purpose — the role/purpose that hooks students into the investigation]","learningTarget":"[Section 2 Inquiry Question — the main inquiry question students will investigate]","lessonPurpose":"[Section 1 History Lab Overview — summary of what students do and why this format works]","materialsNeeded":"[Compiled list: source set documents, investigation worksheet, assessment, intro slides — reference what needs to be printed/prepared]","activities":[{"name":"[Activity name]","duration":"[X min]","description":"[Detailed description of what happens in this phase]"}],"closure":"[Section 8 consolidation/debrief options]","assessment":"[Section 9 assessment with answer key + Section 6 worksheet key prompts]","scaffolds":"[Section 10 teacher notes on scaffolding, differentiation, UDL]","extension":"[Section 10 extension ideas + Section 11 implementation reminders]","notes":"[Section 4 Source Set details + Section 5 Source-by-Source Teacher Support with SCOAPS + Section 7 Teacher Answer Guide]","curriculumConnection":{"bigIdea":"[Relevant BC curriculum big idea]","competencyFocus":"[Relevant curricular competency]","contentConnection":"[Relevant content standard]"}}

The activities array should represent the main lesson flow (typically 5-7 activities covering: hook/intro with role assignment, source distribution, guided source analysis, independent/group investigation, evidence comparison, conclusion writing, debrief).

## Style Requirements
- Write with the judgment and clarity of an excellent history teacher.
- Be specific, concrete, and historically grounded.
- Make materials ready to use or easy to adapt.
- Avoid vague suggestions and unnecessary filler.
- Prioritize depth, clarity, and classroom practicality.
- When historical uncertainty exists, reflect that honestly.`,
  },
  {
    name: "Philosophy for History",
    description: "Students use historical voices, quotations, and evidence to explore a big philosophical question connected to history.",
    structure: {
      icon: "Brain",
      color: "#a855f7",
      sections: [
        "Philosophy for History Lesson Overview",
        "Central Philosophical Question",
        "Why This Question Matters",
        "Historical Background for the Teacher",
        "Opening Reflection Prompt",
        "Quote / Source Set (6-10 quotes)",
        "Source-by-Source Teacher Support",
        "Student Quote Reflection Guide",
        "Analysis and Reflection Questions",
        "Teacher Answer Guide / Likely Interpretations",
        "Discussion Plan",
        "Discussion Supports",
        "Consolidation / Debrief Options",
        "Short Assessment / Check for Understanding",
        "Teacher Notes for Improvement",
        "Implementation Reminders",
      ],
      defaultSliders: {
        prepDemand: 4,
        teacherDirection: 3,
        collaboration: 3,
        assessmentEvidence: 4,
        managementComplexity: 3,
      },
      bestUseCases: [
        "Ethical & philosophical reasoning",
        "Evidence-based moral judgment",
        "Multiple perspectives on values",
      ],
    },
    requiredFields: [
      { field: "topic", label: "Historical Topic / Philosophical Question", type: "text", required: true, placeholder: "e.g. When is revolution justified? (French Revolution)" },
      { field: "grade", label: "Grade Level", type: "select", options: ["6","7","8","9","10","11","12"], useDefault: "gradeLevel" },
      { field: "students", label: "Number of Students", type: "number", default: 30, useDefault: "numStudents" },
      { field: "duration", label: "Lesson Duration (min)", type: "number", default: 60, useDefault: "lessonDuration" },
      { field: "context", label: "Additional Context (optional)", type: "textarea", required: false, placeholder: "Anything else the AI should know..." },
    ],
    promptTemplate: `You are an expert high school history teacher and curriculum designer. Your task is to generate a complete, high-quality "Philosophy for History" lesson.

LESSON CONTEXT:
- Grade level: {{grade}}
- Number of students: {{students}}
- Class time: {{duration}} minutes
- Topic: {{topic}}
{{#context}}Additional teacher notes: {{context}}{{/context}}
{{#unitTitle}}Unit: {{unitTitle}}{{/unitTitle}}
{{#courseName}}Course: {{courseName}}{{/courseName}}
{{#priorLessons}}Prior lessons in this unit: {{priorLessons}}{{/priorLessons}}

Use whatever relevant context is available, such as unit title, lesson topic, learning objectives, curricular competencies, content standards, prior lessons, student age/grade, class time, skills being emphasized, and teacher notes or planning context.

If some details are missing, make reasonable instructional and historical assumptions. Briefly state those assumptions at the beginning. Do not ask follow-up questions unless the task is impossible without them.

Generate the activity in one complete response.

## Purpose of the Template
Create a historically rigorous, engaging "Philosophy for History" lesson in which students use historical voices, quotations, perspectives, and evidence to explore a big philosophical question connected to history.

The lesson should ask students to:
- consider an opening philosophical question before reading
- read and reflect on a set of historical quotes or short sources
- analyze how different voices reveal costs, conflicts, values, and justifications
- decide which quotes support or challenge a position
- reflect on how different people experience the same historical event differently
- answer a final philosophical-historical judgment question in writing

The final lesson should feel:
- intellectually serious
- discussion-rich
- historically grounded
- philosophically thoughtful
- student-friendly
- practical for real classroom use
- aligned to the available learning goals

## Core Design of the Lesson
The lesson must be built around a central philosophical question connected to history.
The question should:
- be meaningful and interesting to students
- invite disagreement and careful reasoning
- be broad enough to matter beyond a single event
- still be grounded in a specific historical topic, event, or case
- be answerable only through a combination of ethical thinking and historical evidence

Examples of the kinds of philosophical questions this template supports include:
- When is violence justified for political change?
- What makes a revolution legitimate?
- Is security more important than liberty in times of crisis?
- Do governments have the right to limit freedom to preserve order?
- When, if ever, is disobedience a moral duty?
- Can a cause be just if it causes widespread suffering?
- Who gets included when people demand "freedom" or "rights"?
- Is stability more valuable than justice?

Do not simply list many possible questions unless brief alternatives would be useful. Select the strongest question for the available lesson context and build the lesson around it.

## Source / Quote Handling Rules
If actual quotations or short sources are already available in the planning context, use them.
If sources are not available, propose a strong set of 6 to 10 short historical quotations or brief source excerpts that would support the lesson.
These should include a mix where possible, such as:
- quotations from historical actors
- excerpts from speeches, letters, diaries, laws, pamphlets, manifestos, interviews, or philosophical works
- quotations representing different sides or stakeholders
- quotations that complicate easy narratives
- quotations from people differently affected by the same event
- quotations that raise moral tension, not just factual information
When suggested rather than provided, clearly label them as "Suggested Quotes / Sources."
The source set should not merely provide information. It should create opportunities for students to:
- compare moral and political perspectives
- identify conflicts in values
- notice contradictions or hypocrisies
- weigh costs and justifications
- recognize that the same event can be experienced differently
- move from first reaction to deeper reasoning

## Design Principles
The generated lesson should:
- align tightly to the lesson or unit goals
- emphasize both historical thinking and philosophical thinking
- help students interpret evidence, not just react emotionally
- ask students to consider both historical context and ethical reasoning
- avoid oversimplified "right answer" framing
- avoid presentism while still allowing thoughtful moral judgment
- reflect historical complexity in student-accessible language
- include appropriate scaffolds and supports
- be classroom-ready and concrete
- prefer depth and usability over excessive length; generate something ambitious but realistically teachable
- avoid false neutrality when the topic involves injustice, oppression, colonization, slavery, genocide, or other power imbalances

## Output Requirements
Generate the lesson using ALL of the following sections. Each section must be thorough and detailed.

# 1. Philosophy for History Lesson Overview
Include:
- Title of the lesson
- Grade level
- Course / unit connection
- Estimated time needed
- Brief summary of what students do
- Why this lesson format is effective for this topic and unit

# 2. Central Philosophical Question
Provide:
- the main philosophical question
- a brief explanation of why it is the strongest fit for the topic and learning goals
- 1 to 2 alternative philosophical questions that could also work

# 3. Why This Question Matters
Explain:
- what makes this question philosophically rich
- what makes it historically grounded
- why students are likely to find it meaningful
- what tensions, disagreements, or trade-offs the question brings out

# 4. Historical Background for the Teacher
Provide concise but rich background notes covering:
- the essential historical context students need
- the key events, people, and stakes involved
- the different groups or perspectives represented
- the main moral, political, or philosophical tensions
- likely areas of confusion or misconception
- what background knowledge students should have before doing the activity

# 5. Opening Reflection Prompt
Create a short opening section that invites students to think about the philosophical question before reading the sources.
This should include:
- a student-friendly version of the central question
- a sentence stem or partial prompt students can complete
- 2 to 4 brief follow-up prompts that help them think before reading
- an optional continuum, agree/disagree prompt, or quickwrite if appropriate

# 6. Quote / Source Set
If quotes or sources are already available, organize and present them clearly.
If not, propose a strong set of 6 to 10 suggested quotes or brief excerpts.
For each quote or source, include:
- quote label or number
- speaker / author
- date if relevant
- source title if relevant
- whether it is primary or secondary
- what perspective it represents
- why it is valuable for this philosophical question

Aim for a set with meaningful variety and opportunities for comparison, contradiction, and moral tension.

# 7. Source-by-Source Teacher Support
For each quote or short source, provide the following:
## A. Student Context / Source Intro
Give any background information students may need in order to make sense of the quote or source.
## B. Language Support
Identify confusing, difficult, or domain-specific words, phrases, or references. Provide brief definitions or explanations.
## C. Easier Version, if Needed
If the quote would likely be too difficult for many students, provide a simplified version that preserves the meaning.
## D. Teacher Insight
Provide a concise teacher-facing note explaining:
- what this quote suggests or argues
- whether it supports, challenges, or complicates the central question
- what values or assumptions are embedded in it
- what students may miss at first glance
- what useful discussion it could spark

# 8. Student Quote Reflection Guide
Create a student-facing reflection structure.
For each quote or source, provide a prompt structure students can use to record their thinking.
The reflection structure should include prompts such as:
- What is this person saying?
- Does this quote support, challenge, or complicate the central question?
- What values, fears, or priorities are visible here?
- What does this quote reveal about the costs, conflicts, or justifications involved?
- Whose perspective is represented here?
- Who might disagree with this quote, and why?

# 9. Analysis and Reflection Questions
Create a final student reflection section.
Include prompts that ask students to:
- identify which quotes support one side of the issue and which challenge it
- consider whether the sources challenge what they thought before
- analyze how different people experience the same historical event differently
- answer the final philosophical-historical judgment question in a well-reasoned way

# 10. Teacher Answer Guide / Likely Interpretations
Provide a teacher-facing guide that outlines:
- the strongest likely interpretations students may reach
- how different quotes may cluster together
- key tensions or contradictions students may notice
- likely misconceptions or weak readings
- how to respond if students reach different but defensible conclusions
- what would make a strong final written response

# 11. Discussion Plan
Suggest a clear discussion structure for using the lesson in class.
Include:
- how students might first reflect individually
- when they might discuss in pairs or small groups
- how to move into whole-class discussion
- how to ensure multiple perspectives are heard
- how to keep the discussion evidence-based and respectful
- optional extensions such as a silent discussion, four corners, or philosophical chairs if appropriate

# 12. Discussion Supports
Create supports for productive discussion, such as:
- sentence starters for agreeing or disagreeing respectfully
- sentence starters for interpreting a quote
- sentence starters for building on someone else's idea
- sentence starters for changing one's mind
- norms for discussing moral disagreement
- reminders about grounding ideas in sources, not just personal opinion

# 13. Consolidation / Debrief Options
Suggest several strong ways students can consolidate learning after the lesson.
Include a mix of discussion-based, written, reflective, and creative options.
For each, explain what it helps students practice or understand.

# 14. Short Assessment / Check for Understanding
Create a short assessment to check understanding of:
- the historical content
- the philosophical question
- the key perspectives in the quotes
- how evidence can support a philosophical-historical judgment
Include an answer key or teacher notes.

# 15. Teacher Notes for Improvement
Provide suggestions under these headings:
- How to scaffold it further
- How to differentiate it
- How to strengthen UDL
- How to make it more engaging without undermining rigor
- How to extend it into a broader lesson or unit

# 16. Implementation Reminders
Provide practical reminders for running the lesson well, including:
- pacing
- transitions
- how to avoid students treating the activity as only opinion-based
- how to support students with difficult language
- how to keep the philosophical question connected to historical evidence
- how to close the lesson without pretending there is only one acceptable answer when the issue is genuinely debatable

## CRITICAL: JSON Output Format
After generating all sections above, you MUST also return a JSON object that maps the content into these lesson plan fields. The JSON must appear at the end of your response, wrapped in a code block.

Return JSON with these fields:
{"hook":"[Section 5 Opening Reflection Prompt — the opening reflection that draws students into the philosophical question]","learningTarget":"[Section 2 Central Philosophical Question — the main question students will explore]","lessonPurpose":"[Section 1 Overview + Section 3 Why This Question Matters — summary of the lesson and why it matters]","materialsNeeded":"[Compiled list: quote collection handout, reflection worksheet, discussion slides, assessment — reference what needs to be printed/prepared]","activities":[{"name":"[Activity name]","duration":"[X min]","description":"[Detailed description of what happens in this phase]"}],"closure":"[Section 13 consolidation/debrief options]","assessment":"[Section 14 assessment with answer key + Section 9 analysis and reflection questions]","scaffolds":"[Section 12 Discussion Supports + Section 15 teacher notes on scaffolding, differentiation, UDL]","extension":"[Section 15 extension ideas + Section 16 implementation reminders]","notes":"[Section 4 Historical Background + Section 6 Quote/Source Set + Section 7 Source-by-Source Teacher Support + Section 10 Teacher Answer Guide + Section 11 Discussion Plan]","curriculumConnection":{"bigIdea":"[Relevant BC curriculum big idea]","competencyFocus":"[Relevant curricular competency]","contentConnection":"[Relevant content standard]"}}

The activities array should represent the main lesson flow (typically 5-7 activities covering: opening reflection, quote reading/analysis, individual reflection, small group discussion, whole-class philosophical discussion, written response, debrief).

## Style Requirements
- Write with the judgment and clarity of an excellent history teacher.
- Be specific, concrete, and historically grounded.
- Make materials ready to use or easy to adapt.
- Avoid vague suggestions and unnecessary filler.
- Prioritize depth, clarity, and classroom practicality.
- When historical uncertainty exists, reflect that honestly.`,
  },
  {
    name: "Structured Academic Controversy",
    description: "Students investigate a debatable historical question, prepare arguments for one side, listen to the opposing side, switch perspectives, and work toward common ground.",
    structure: {
      icon: "Swords",
      color: "#f43f5e",
      sections: [
        "SAC Lesson Overview",
        "Central Controversy Question",
        "Why This Question Works for a SAC",
        "Historical Background for the Teacher",
        "Source Set (4-6 sources)",
        "Source-by-Source Teacher Support",
        "SAC Procedure — step-by-step",
        "Student Directions",
        "Student Response Guide (worksheet-aligned)",
        "Argument Bank / Likely Evidence",
        "Discussion Supports",
        "Consolidation / Debrief Options",
        "Short Assessment / Check for Understanding",
        "Teacher Notes for Improvement",
        "Implementation Reminders",
      ],
      defaultSliders: {
        prepDemand: 4,
        teacherDirection: 3,
        collaboration: 5,
        assessmentEvidence: 4,
        managementComplexity: 3,
      },
      bestUseCases: [
        "Genuinely debatable questions",
        "Perspective-switching & empathy",
        "Evidence-based argumentation",
      ],
    },
    requiredFields: [
      { field: "topic", label: "Historical Topic / Controversy Question", type: "text", required: true, placeholder: "e.g. Was the Treaty of Versailles fair?" },
      { field: "grade", label: "Grade Level", type: "select", options: ["6","7","8","9","10","11","12"], useDefault: "gradeLevel" },
      { field: "students", label: "Number of Students", type: "number", default: 30, useDefault: "numStudents" },
      { field: "duration", label: "Lesson Duration (min)", type: "number", default: 60, useDefault: "lessonDuration" },
      { field: "context", label: "Additional Context (optional)", type: "textarea", required: false, placeholder: "Anything else the AI should know..." },
    ],
    promptTemplate: `You are an expert high school history teacher and curriculum designer. Your task is to generate a complete, high-quality "Structured Academic Controversy" (SAC) lesson.

LESSON CONTEXT:
- Grade level: {{grade}}
- Number of students: {{students}}
- Class time: {{duration}} minutes
- Topic: {{topic}}
{{#context}}Additional teacher notes: {{context}}{{/context}}
{{#unitTitle}}Unit: {{unitTitle}}{{/unitTitle}}
{{#courseName}}Course: {{courseName}}{{/courseName}}
{{#priorLessons}}Prior lessons in this unit: {{priorLessons}}{{/priorLessons}}

Use whatever relevant context is available, such as unit title, lesson topic, learning objectives, curricular competencies, content standards, prior lessons, student age/grade, class time, skills being emphasized, and teacher notes or planning context.

If some details are missing, make reasonable instructional and historical assumptions. Briefly state those assumptions at the beginning. Do not ask follow-up questions unless the task is impossible without them.

Generate the activity in one complete response.

## Purpose of the Template
Create a historically rigorous, engaging Structured Academic Controversy lesson in which students investigate a genuinely debatable historical question, prepare arguments for one side, listen carefully to the opposing side, switch perspectives, and then work toward common ground.

The lesson should ask students to:
- record the central question
- develop arguments in favor and against using sources
- take notes on the opposing side's arguments
- identify contentious issues
- propose possible solutions
- articulate common ground reached

The final lesson should feel:
- intellectually serious
- balanced but not falsely neutral
- student-friendly
- discussion-rich
- practical for real classroom use
- aligned to the available learning goals

## Core Design of the SAC
The lesson must be built around a historical question that:
- has at least two plausible, evidence-based sides
- cannot be answered well with a simple yes/no reaction
- requires interpretation, prioritization, and trade-off thinking
- invites students to use evidence rather than personal opinion alone
- is suitable for students first arguing one side, then switching and arguing the other, then synthesizing a shared position

Avoid questions where one side is obviously frivolous, factually baseless, or morally unserious. If the topic involves injustice, oppression, colonization, slavery, genocide, or other power imbalances, the SAC should preserve moral clarity while still inviting meaningful historical analysis about causes, choices, responsibility, methods, consequences, or competing priorities.

## Source Handling Rules
If actual sources are already available in the planning context, use them.
If sources are not available, propose a strong set of 4 to 6 sources that would support the SAC. These should include a useful mix where possible, such as:
- primary sources
- secondary sources
- images
- maps
- graphs or charts
- speeches
- letters
- diary excerpts
- legal or political documents
- oral histories
- historians' interpretations
When suggested rather than provided, clearly label them as "Suggested Sources."
The source set should not merely provide information. It should create opportunities for students to:
- build arguments on both sides
- compare perspectives
- identify contradictions
- judge reliability
- notice missing perspectives
- move toward a nuanced synthesis

## Inquiry / Controversy Question Selection
Select the strongest central SAC question for the lesson based on the available context. Do not simply list many options unless brief alternatives would be useful.

The question should be:
- interesting to students
- written in student-friendly language
- genuinely debatable using historical evidence
- complex enough to support argument, rebuttal, and synthesis
- narrow enough to be teachable in the available time

If helpful, frame the question as:
- a yes/no question with nuance
- a "to what extent" question
- a "which mattered more" question
- an "was ___ justified" question
- an "what was the best response" question

## Design Principles
The generated lesson should:
- align tightly to the lesson or unit goals
- emphasize historical thinking, including evidence, perspective, cause and consequence, continuity and change, significance, or ethical judgment where appropriate
- prepare students to argue from evidence rather than opinion
- help students understand the difference between strong and weak arguments
- require students to listen, restate, and engage fairly with opposing evidence
- avoid oversimplified "right answer" framing
- avoid presentism
- reflect historical complexity in student-accessible language
- include appropriate scaffolds and supports
- be classroom-ready and concrete
- prefer depth and usability over excessive length; generate something ambitious but realistically teachable
- avoid false neutrality when the topic involves injustice, oppression, colonization, slavery, or other power imbalances

## Output Requirements
Generate the lesson using ALL of the following sections. Each section must be thorough and detailed.

# 1. SAC Lesson Overview
Include:
- Title of the lesson
- Grade level
- Course / unit connection
- Estimated time needed
- Brief summary of what students do
- Why SAC is the right format for this topic and lesson

# 2. Central Controversy Question
Provide:
- the main SAC question
- a brief explanation of why it is the strongest fit for the topic and learning goals
- 1 to 2 alternative SAC questions that could also work

# 3. Why This Question Works for a SAC
Explain:
- what makes the question genuinely debatable
- what the strongest arguments on each side are likely to revolve around
- what students are likely to learn by arguing both sides
- what nuance or synthesis students may discover by the end

# 4. Historical Background for the Teacher
Provide concise but rich background notes covering:
- the essential historical context students need
- the main events, people, and stakes involved
- why historians or historical actors might disagree on this question
- what background knowledge students will need before beginning
- likely areas of confusion or misconception

# 5. Source Set
If sources are already available, organize and present them clearly.
If not, propose a strong set of 4 to 6 suggested sources.
For each source, include:
- source title or description
- source type
- whether it is primary or secondary
- which side it is most useful for, or whether it can support both sides
- what perspective or information it contributes
- why it is valuable for answering the controversy question
Aim for a source set with meaningful variety and opportunities for comparison, contradiction, corroboration, and reliability analysis.

# 6. Source-by-Source Teacher Support
For each source, provide the following:
## A. Student Context / Source Intro
Give any background information students may need in order to make sense of the source.
## B. Language Support
Identify confusing, difficult, or domain-specific words, phrases, or references. Provide brief definitions or explanations.
## C. Easier Version, if Needed
If the source would likely be too difficult for many students, provide a simplified side-by-side version that preserves the meaning.
## D. Source Analysis
Provide a concise teacher-facing source analysis including:
- what the source claims
- which side it most strongly supports
- what its limitations are
- how students might misread or misuse it
- what useful counterargument could be made against it

# 7. SAC Procedure
Lay out a clear step-by-step plan for running the Structured Academic Controversy.
Include:
- how groups should be formed
- whether students work in pairs within a group of 4, or another structure
- how the first side is assigned
- when students prepare arguments
- when they present
- when they take notes on the opposing side
- when they switch sides
- when they discuss contentious issues
- when they identify common ground
- how the lesson ends

# 8. Student Directions
Write clear, student-friendly directions for the SAC.
These directions should explain:
- the question they are investigating
- how they should use the sources
- how they should prepare arguments
- how they should listen and take notes
- how and why they will switch sides
- how they should work toward common ground
- expectations for respectful, evidence-based discussion

# 9. Worksheet-Aligned Student Response Guide
Create a student response guide that includes:
- Question
- Arguments in Favor (three argument spaces tied to sources)
- Arguments Against (three argument spaces tied to sources)
- Notes on Opposing Side's Arguments In Favor
- Notes on Opposing Side's Arguments Against
- Contentious Issues
- Possible Solutions
- Common Ground Reached
For each section, provide clear student-facing prompts or sentence starters.

# 10. Argument Bank / Likely Evidence
Provide a teacher-facing guide to likely arguments students may make.
Include:
- 3 to 5 strong arguments in favor
- 3 to 5 strong arguments against
- the best evidence students may use for each
- weak or superficial arguments students may make
- how to push students toward stronger reasoning

# 11. Discussion Supports
Create supports for productive discussion, such as:
- sentence starters for presenting an argument
- sentence starters for responding respectfully
- sentence starters for acknowledging strong opposing evidence
- sentence starters for identifying common ground
- norms for disagreement
- reminders about using evidence instead of volume or confidence

# 12. Consolidation / Debrief Options
Suggest several strong ways students can consolidate learning after the SAC.
Include a mix of discussion-based, written, reflective, and creative options.
For each, explain what it helps students practice or understand.

# 13. Short Assessment / Check for Understanding
Create a short assessment to check understanding of:
- the historical content
- the controversy question
- the strongest arguments on both sides
- how evidence supports an argument
- what common ground or synthesis students may reach
Include an answer key or teacher notes.

# 14. Teacher Notes for Improvement
Provide suggestions under these headings:
- How to scaffold it further
- How to differentiate it
- How to strengthen UDL
- How to make it more engaging without undermining rigor
- How to extend it into a broader lesson or unit

# 15. Implementation Reminders
Provide practical reminders for running the SAC well, including:
- pacing
- transitions
- how to prevent discussion from becoming personal or superficial
- how to ensure both sides are represented fairly
- how to support students in switching sides sincerely
- how to keep the focus on evidence, not just opinion
- how to close with nuance rather than forcing fake agreement

## CRITICAL: JSON Output Format
After generating all sections above, you MUST also return a JSON object that maps the content into these lesson plan fields. The JSON must appear at the end of your response, wrapped in a code block.

Return JSON with these fields:
{"hook":"[Section 3 Why This Question Works — what makes the question debatable and what students will discover]","learningTarget":"[Section 2 Central Controversy Question — the main SAC question]","lessonPurpose":"[Section 1 SAC Lesson Overview — summary of what students do and why SAC format works]","materialsNeeded":"[Compiled list: source set documents, SAC worksheet, student directions, discussion supports, assessment — reference what needs to be printed/prepared]","activities":[{"name":"[Activity name]","duration":"[X min]","description":"[Detailed description of what happens in this phase]"}],"closure":"[Section 12 consolidation/debrief options]","assessment":"[Section 13 assessment with answer key + Section 9 worksheet key prompts]","scaffolds":"[Section 11 Discussion Supports + Section 14 teacher notes on scaffolding, differentiation, UDL]","extension":"[Section 14 extension ideas + Section 15 implementation reminders]","notes":"[Section 4 Historical Background + Section 5 Source Set + Section 6 Source-by-Source Support + Section 7 SAC Procedure + Section 10 Argument Bank]","curriculumConnection":{"bigIdea":"[Relevant BC curriculum big idea]","competencyFocus":"[Relevant curricular competency]","contentConnection":"[Relevant content standard]"}}

The activities array should represent the main lesson flow (typically 6-8 activities covering: intro/hook, source reading, argument preparation Side A, Side A presents/Side B listens, switch sides and prepare, Side B presents/Side A listens, identify common ground, debrief/written response).

## Style Requirements
- Write with the judgment and clarity of an excellent history teacher.
- Be specific, concrete, and historically grounded.
- Make materials ready to use or easy to adapt.
- Avoid vague suggestions and unnecessary filler.
- Prioritize depth, clarity, and classroom practicality.
- When historical uncertainty exists, reflect that honestly.`,
  },
];

async function main() {
  console.log("Seeding BC Curriculum standards...");

  // Clear existing data
  await prisma.curriculumStandard.deleteMany();
  await prisma.lessonTemplate.deleteMany();

  // Seed curriculum standards
  await prisma.curriculumStandard.createMany({
    data: bcCurriculumData,
  });

  console.log(`Seeded ${bcCurriculumData.length} curriculum standards.`);

  // Seed templates
  for (const template of defaultTemplates) {
    await prisma.lessonTemplate.create({
      data: template,
    });
  }

  console.log(`Seeded ${defaultTemplates.length} lesson templates.`);
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
