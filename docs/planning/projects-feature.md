# Projects & Learning Plans Feature

**Status**: 🟡 Under Consideration
**Target**: Version 2.2+
**Parent**: [feature-requests.md](./feature-requests.md#5-projects--learning-plans-)

## Overview

Link daily habits to larger projects and goals. A habit like "Practice bass for 10 minutes" connects to a "Learn Bass" project containing lesson plans, external resources, progress notes, and eventually AI-assisted tutoring.

## Motivation

Daily habits work well for consistency, but lack context for *why* you're doing them or *what* you're working toward. Projects provide:

- **Purpose**: Connect daily actions to bigger goals
- **Planning**: Structured approach to learning/achieving
- **Resources**: Central place for links, notes, references
- **Progress**: See how daily habits contribute to larger outcomes

## Example: Learn Bass Guitar

```
Project: Learn Bass Guitar
├── Plan (markdown)
│   ├── Month 1: Basics (finger positioning, simple scales)
│   ├── Month 2: First songs (easy basslines)
│   └── Month 3: Technique (slap, fingerstyle)
├── Resources
│   ├── https://www.studybass.com/
│   ├── https://www.youtube.com/@BassBuzz
│   └── Local PDF: bass-scale-charts.pdf
├── Notes
│   └── 2026-01-18: Struggled with fretting, need to practice F chord
└── Linked Habits
    └── "Practice bass for 10 minutes" (daily)
```

---

## Phase 1: MVP - Markdown Projects

**Goal**: Simple project files linked to habits

### Features

- [ ] Create/edit project as markdown file
- [ ] Link one or more habits to a project
- [ ] View project from habit detail or dedicated projects page
- [ ] Basic markdown editor in-app (or link to external editor)

### Data Model

```typescript
// New table: projects
interface Project {
  id: string;
  name: string;
  description?: string;
  markdownPath: string;  // e.g., ~/.habit-tracker/projects/learn-bass.md
  createdAt: Date;
  updatedAt: Date;
}

// New table: habit_projects (many-to-many)
interface HabitProject {
  habitId: string;
  projectId: string;
}
```

### Storage

- Project markdown files: `~/.habit-tracker/projects/<project-slug>.md`
- Metadata in SQLite database

### UI Components

1. **Projects List Page** (`/projects`)
   - List all projects
   - Create new project button

2. **Project Detail Page** (`/projects/:id`)
   - View/edit markdown content
   - See linked habits
   - Quick stats (habit completion for linked habits)

3. **Habit → Project Link**
   - In habit settings, select associated project
   - On habit card, show project badge/link

### Implementation Notes

- Use a simple markdown editor (e.g., `react-markdown` for view, `textarea` for edit)
- Start with basic edit mode, can enhance later
- Store markdown as files (not in DB) for easy external editing

---

## Phase 2: Enhanced Project View

**Goal**: Richer project management with resources and progress tracking

### Features

- [ ] Structured resources section (links, files, notes)
- [ ] Progress milestones / checkpoints
- [ ] Project timeline view
- [ ] Notes/journal tied to project
- [ ] Tags for organizing projects

### Data Model Additions

```typescript
interface ProjectResource {
  id: string;
  projectId: string;
  type: 'link' | 'file' | 'note';
  title: string;
  url?: string;
  filePath?: string;
  content?: string;
  createdAt: Date;
}

interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  completedAt?: Date;
  order: number;
}
```

### UI Enhancements

1. **Resources Panel**
   - Add/edit/delete links
   - Upload files (stored locally)
   - Quick notes

2. **Milestones**
   - Visual progress bar
   - Check off milestones
   - Optional target dates

3. **Project Dashboard**
   - Habit completion streak for linked habits
   - Time spent (if using data tracking)
   - Recent activity

---

## Phase 3: AI Tutor Integration

**Goal**: LLM-assisted planning, feedback, and learning recommendations

### Features

- [ ] AI-generated project plans based on goal
- [ ] Plan refinement through conversation
- [ ] Practice suggestions based on logged data
- [ ] Learning path recommendations
- [ ] Progress analysis and feedback

### User Stories

1. **Plan Generation**
   > "I want to learn bass guitar from scratch. I can practice 10-15 minutes daily."
   >
   > AI generates a structured 3-month plan with weekly goals.

2. **Plan Refinement**
   > "I'm finding scales boring. Can we add more songs earlier?"
   >
   > AI adjusts the plan, suggests beginner-friendly songs.

3. **Progress Check-in**
   > After 2 weeks of logged practice...
   >
   > "You've practiced 12 of the last 14 days! Based on your notes about struggling with F chord, here are some exercises..."

4. **Resource Suggestions**
   > "What's a good YouTube channel for beginner bass?"
   >
   > AI suggests resources, can auto-add to project.

### Technical Considerations

- **LLM Integration**: API calls to Claude/OpenAI
- **Context**: Feed project plan + recent habit logs + notes
- **Privacy**: All data stays local, API calls only when user initiates
- **Cost**: Consider token usage, maybe local LLM option

### UI Components

1. **Chat Interface** in project view
   - Ask questions about the project
   - Get suggestions and feedback
   - Refine plan through conversation

2. **AI Suggestions Panel**
   - Proactive tips based on activity
   - "You haven't practiced in 3 days, here's a quick 5-min exercise"

3. **Plan Editor with AI Assist**
   - Highlight text → "Expand this section"
   - "Generate exercises for this milestone"

---

## Open Questions

1. **Scope**: Should projects be separate from habits, or tightly coupled?
2. **Multiple habits per project**: How to handle habit completion stats?
3. **Project templates**: Pre-built templates for common goals (fitness, language learning, music)?
4. **Sharing**: Eventually share project plans with community?
5. **AI costs**: Free tier vs paid for AI features?

---

## Dependencies

- Phase 1: None (can build independently)
- Phase 2: Phase 1 complete
- Phase 3: Phase 2 complete, LLM API integration

## Related Features

- **Data Tracking** (V2): Track practice time, can feed into project progress
- **Graph View** (V2): Visualize project-related habit data
- **Notifications** (V2.1): Remind about project milestones

---

**Last Updated**: 2026-01-18
