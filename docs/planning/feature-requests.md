# Feature Requests & Roadmap

This document tracks feature requests, enhancements, and the product roadmap for Habit Tracker.

## Status Labels

- 🟢 **Planned**: Scheduled for upcoming release
- 🟡 **Under Consideration**: Being evaluated
- 🔵 **Nice to Have**: Would be good but not prioritized
- ⚪ **Deferred**: Not in current roadmap

## Version 1.0 (MVP) - Complete

**Status**: ✅ Complete

### Features Delivered

- ✅ Daily habit tracking with deadlines
- ✅ Website blocking via hosts file
- ✅ Complete/skip habits with reasons
- ✅ Habit history and logs
- ✅ Automatic daemon service (macOS)
- ✅ Timezone-aware scheduling
- ✅ Dashboard statistics
- ✅ Full test coverage (BDD/TDD/E2E)

---

## Version 2.0 (Redesign) - Complete

**Status**: ✅ Complete (January 2026)

### Features Delivered

- ✅ **Daily Checklist View**: Simple checkbox-based habit completion
- ✅ **Quick Add Habit**: Rapid habit creation from main view
- ✅ **Calendar View**: Visual calendar for tracking history
- ✅ **Graph View**: Data visualization for tracked values
- ✅ **Global Blocked Websites**: Centralized blocking configuration (replaced per-habit blocking)
- ✅ **Data Tracking**: Track numeric values with configurable units
- ✅ **Habit Settings Panel**: Individual habit configuration
- ✅ **Global Settings Page**: Manage blocked websites and preferences
- ✅ **Active Days**: Set which days each habit applies
- ✅ **Start Time Support**: Configure when blocking begins (not just deadline)
- ✅ **Dev/Prod Environment Separation**: Sandbox mode for testing

### V2 Schema Changes

- Added `settings` table for global configuration
- Added `startTimeUtc` to habits
- Added `dataTracking`, `dataUnit` to habits
- Added `activeDays` to habits
- Added `value` to habit logs
- Removed per-habit `blockedWebsites` (moved to global settings)

### V2 Breaking Changes

- Blocking is now global (all configured sites blocked when ANY timed habit is incomplete)
- Per-habit blocking removed in favor of simpler global approach
- New API endpoints for settings (`/api/settings`)

---

## Version 2.1 - Quick Wins

**Status**: 🟢 Planned

**Target**: Q1 2026

### Features

#### 1. Habit Streaks 🟢
**Priority**: High
**Effort**: Medium
**Description**: Track consecutive days of habit completion

**Requirements**:
- Show current streak for each habit
- Display longest streak achieved
- Visual indicator (flame icon?) for active streaks
- Streak broken by missed days (not skipped days)

#### 2. Habit Categories/Tags 🟢
**Priority**: Medium
**Effort**: Low
**Description**: Organize habits with tags/categories

**Requirements**:
- Add tags to habits (e.g., "Health", "Work", "Learning")
- Filter habits by tag
- Color-code tags
- Multiple tags per habit

#### 3. Notifications 🟢
**Priority**: High
**Effort**: Medium
**Description**: macOS native notifications for upcoming deadlines

**Requirements**:
- Notification 15 minutes before deadline
- Notification at deadline
- Notification when habit is marked as missed
- User can configure notification times
- Sound optional

**Technical**:
- Use `node-notifier` package
- Desktop notifications via macOS Notification Center

#### 4. Dark Mode 🟢
**Priority**: Medium
**Effort**: Low
**Description**: Dark theme for the UI

**Implementation**:
- Toggle in settings
- Persist preference
- System preference detection
- Smooth transitions

#### 5. Faster Blocking Updates ✅
**Priority**: High
**Effort**: Low
**Status**: Complete (January 2026)
**Description**: Reduce delay between habit completion and unblocking websites

**Implementation**:
- Unix socket IPC between backend and daemon (`~/.habit-tracker/daemon.sock`)
- Backend notifies daemon instantly (~10ms) when habits/settings change
- 30-second fallback polling for time-based triggers (deadlines)
- New API endpoint: `POST /api/daemon/sync` for manual refresh

**Files Added**:
- `packages/daemon/src/socket-server.ts` - Unix socket listener
- `packages/shared/src/daemon-client.ts` - Client for sending refresh signals

**Technical Notes**:
- DNS cache also needs flushing (already implemented)
- Browser may cache DNS (user may need to refresh page)

#### 6. Custom Block Page 🟡
**Priority**: Medium
**Effort**: High
**Description**: Show habit tracker UI instead of "offline" page when sites are blocked

**Current Behavior**:
- Blocked sites redirect to 127.0.0.1
- Nothing listening → browser shows offline/connection error
- YouTube shows its service worker offline page

**Options**:
1. **Serve block page on port 80**
   - Pros: Works for HTTP sites
   - Cons: HTTPS sites (most) show certificate error instead

2. **Local HTTPS proxy with self-signed cert**
   - Pros: Can intercept HTTPS
   - Cons: Complex, user must trust cert, security concerns

3. **Browser extension** (see existing backlog item)
   - Pros: Full control, can inject custom page
   - Cons: Per-browser, can be disabled

4. **Accept current behavior + Chrome homepage**
   - Pros: Simple, no additional complexity
   - Cons: Not a true "block page"

**Recommendation**: Option 4 short-term, Option 3 (browser extension) long-term

**Related**: See "Browser Extension" in Version 3.0

#### 7. Chrome Homepage Integration 🟢
**Priority**: Low
**Effort**: Very Low
**Description**: Document/automate setting Chrome homepage to habit tracker

**Implementation**:
- Add to deployment guide: instructions to set Chrome homepage to `http://localhost:5173`
- Optional: Create Chrome policy file to set homepage automatically

**User Benefit**:
- New tabs show habits
- Blocked site → user opens new tab → sees what habits need completing

#### 8. Dev Mode Visual Indicator 🔵
**Priority**: Low
**Effort**: Very Low
**Description**: Show visual indicator when running in development/sandbox mode

**Requirements**:
- Clear visual distinction between dev and production environments
- Visible banner, badge, or color accent indicating "DEV MODE"
- Prevents confusion about which database/environment is active

**Implementation Options**:
- Fixed banner at top/bottom of page
- Different favicon for dev mode
- Accent color change (e.g., orange border)
- "DEV" badge in header

---

## Version 2.2 - Enhanced Functionality

**Status**: 🟡 Under Consideration

**Target**: Q2 2026

### Features

#### 5. Projects & Learning Plans 🟡
**Priority**: High
**Effort**: High (phased)
**Description**: Link habits to larger projects/goals with planning, resources, and AI-assisted tutoring

**Use Case**: Daily "Practice bass for 10 minutes" habit linked to a "Learn Bass" project with lesson plans, resource links, and progress tracking.

**Phases**:
1. **MVP**: Markdown-based project files linked to habits
2. **Enhanced**: Rich project view with resources and progress
3. **AI Tutor**: LLM-assisted planning and learning recommendations

📄 **Detailed Plan**: [docs/planning/projects-feature.md](./projects-feature.md)

#### 6. Weekly Habits 🟡
**Priority**: High
**Effort**: Medium
**Description**: Support for habits with weekly frequency

**Note**: V2 partially supports this via `activeDays` field.

**Requirements**:
- Different deadlines per day
- Streak calculation accounts for off-days

#### 6. Custom Recurrence Patterns 🟡
**Priority**: Medium
**Effort**: Very High
**Description**: Fully customizable habit schedules

**Examples**:
- Every other day
- 3 times per week (any days)
- Once per month
- Custom intervals

**Technical**:
- Use RRULE library for recurrence
- Complex UI for pattern selection

#### 7. Habit Templates 🔵
**Priority**: Low
**Effort**: Low
**Description**: Pre-built habit templates

**Templates**:
- Morning Routine (Exercise, Meditation, Journaling)
- Work Productivity (Deep Work, Email, Stand-up)
- Health & Fitness (Workout, Hydration, Sleep)
- Learning (Read, Course, Practice)

#### 8. Habit Dependencies 🔵
**Priority**: Low
**Effort**: High
**Description**: Create chains of habits

**Example**:
- "Breakfast" must be completed before "Vitamins"
- "Morning Routine" includes 3 sub-habits

---

## Version 3.0 - Multi-Platform & Cloud

**Status**: ⚪ Deferred

**Target**: Q3 2026

### Major Features

#### 9. Cross-Platform Support ⚪
**Priority**: High
**Effort**: Very High
**Description**: Windows and Linux support

**Requirements**:
- Daemon works on Windows (Task Scheduler)
- Daemon works on Linux (systemd)
- Platform-specific hosts file handling
- Unified installer

#### 10. Cloud Sync ⚪
**Priority**: High
**Effort**: Very High
**Description**: Sync habits across devices

**Requirements**:
- Cloud backend (Firebase/Supabase)
- Real-time sync
- Conflict resolution
- Offline support

#### 11. Mobile App (iOS/Android) ⚪
**Priority**: High
**Effort**: Very High
**Description**: Native mobile apps

**Features**:
- View habits
- Mark complete/skip
- Push notifications
- Home screen widgets
- Face ID/Touch ID for quick check-in

#### 12. Browser Extension ⚪
**Priority**: Medium
**Effort**: High
**Description**: Chrome/Firefox extension for blocking

**Advantages over hosts file**:
- More granular control
- Easier installation
- Can block specific pages
- Custom block pages with motivation

#### 13. GitHub Integration 🟡
**Priority**: Medium
**Effort**: Medium
**Description**: Set up GitHub repository and integrate with project workflow

**Requirements**:
- Create GitHub repository for the project
- Set up issue templates (feature request, bug report)
- Configure GitHub Actions for CI/CD
- Migrate feature tracking to GitHub Issues
- Update documentation to reference GitHub workflow

**Follow-up Tasks** (after setup):
- Update "How to Request Features" section to use GitHub Issues
- Add contributing guidelines (CONTRIBUTING.md)
- Set up project board for tracking progress

---

## Version 4.0 - Social & Gamification

**Status**: ⚪ Deferred

**Target**: Q4 2026

### Features

#### 13. Social Features ⚪
**Priority**: Medium
**Effort**: Very High
**Description**: Share progress and compete with friends

**Features**:
- Add friends
- Share streaks
- Group challenges
- Accountability partners
- Weekly leaderboards

#### 14. Advanced Gamification ⚪
**Priority**: Medium
**Effort**: High
**Description**: Achievements, levels, rewards

**Features**:
- Badges for milestones
- User levels and XP
- Daily/weekly challenges
- Reward redemption system
- Avatar customization

#### 15. Data Export & Analytics ⚪
**Priority**: Low
**Effort**: Medium
**Description**: Export data and advanced analytics

**Note**: V2 already supports viewing data via GraphView.

**Additional Features**:
- CSV/JSON export
- PDF report
- Advanced analytics

---

## Technical Debt

### Completed in V2

- ✅ Global settings architecture
- ✅ Environment separation (dev/prod)
- ✅ Better database schema

### Remaining

1. ~~**Fix DB Path Bug (Dev Environment)**~~ ✅ **COMPLETE** (2026-01-18)
   - Daemon and backend used relative `DB_PATH` from different working directories
   - npm workspaces runs each package from its own directory, not monorepo root
   - **Fix**: Added `resolveDbPath()` function to both `backend/src/db/index.ts` and `daemon/src/scheduler.ts` that uses `INIT_CWD` (npm's original cwd) to resolve relative paths
   - Updated `.env.development` to use `DB_PATH=./packages/backend/data/dev`

2. ~~**Production Deployment Setup**~~ ✅ **COMPLETE** (2026-01-18)
   - ✅ Created launchd services for backend, frontend, and daemon
   - ✅ Services persist across laptop restarts
   - ✅ Hosts file blocking works end-to-end
   - ✅ Created `scripts/install-production.sh` and `scripts/uninstall-production.sh`
   - ✅ Added `docs/workflows/deployment-guide.md`
   - ✅ Added `docs/PRODUCTION-STATE.md` for tracking system modifications
   - **Verification status**:
     - [x] All 3 services running after reboot (`launchctl list | grep habit-tracker`)
     - [x] Backend health check (`curl localhost:3000/health`)
     - [x] Frontend loads (`open localhost:5173`)
     - [x] Hosts file shows blocked domains when habits incomplete
     - [x] Domains unblocked after habits completed (with ~60s delay)
     - [x] Daemon logs show activity (`~/.habit-tracker/logs/daemon.log`)
   - **Known requirements**:
     - Chrome "Secure DNS" must be set to "OS default" for blocking to work
     - See `docs/PRODUCTION-STATE.md` for full system state tracking

3. **Improve Error Messages**
   - More specific validation errors
   - User-friendly language
   - Actionable suggestions

4. **Add Loading States**
   - Skeleton screens
   - Progress indicators
   - Better UX during async operations

5. **Optimize Database Queries**
   - Add indexes
   - Use database views
   - Cache frequently accessed data

6. **Improve Daemon Efficiency**
   - Only check changed habits
   - Debounce rapid changes
   - Better error recovery

8. **Fix Vite Build Warnings for daemon-client**
   - `daemon-client.ts` in shared package uses Node.js modules (`net`, `path`, `os`)
   - Vite warns about externalized modules during frontend build
   - Frontend doesn't use these functions, but they're exported from shared package
   - **Fix options**:
     1. Move `daemon-client.ts` to backend package (breaks shared package pattern)
     2. Create separate entry point in shared for server-only exports
     3. Use dynamic imports in daemon-client
     4. Configure Vite to suppress these specific warnings

7. **Accessibility Audit**
   - Screen reader support
   - Keyboard navigation
   - WCAG 2.1 AA compliance

10. **GraphView Testing**
   - **Priority**: Medium
   - **Effort**: Low
   - **Description**: Add comprehensive tests for GraphView component
   - **Requirements**:
     - Unit tests for coordinate calculations (`getY`, `getX`)
     - Unit tests for SVG path generation (`pathData`, `areaData`)
     - Unit tests for stats calculations (average, latest value)
     - Component tests with mock data fixtures
     - Test empty state and loading state rendering
     - Test date range selection behavior
   - **Test Data Fixtures**:
     - Create mock `GraphDataPoint[]` arrays with various scenarios
     - Edge cases: single point, identical values, large ranges, negative padding
   - **Files to create**:
     - `packages/frontend/src/components/__tests__/GraphView.test.tsx`
     - `packages/frontend/src/test/fixtures/graphData.ts`

9. **Documentation Maintenance with Cheaper Models** 🟡
   - **Priority**: Low
   - **Effort**: Medium
   - **Description**: Use cheaper models (Haiku) for background documentation tasks
   - **Investigation Questions**:
     - Can documentation updates run as background agents with Haiku?
     - What information should be surfaced to main context?
     - How to keep docs in sync without bloating expensive model context?
   - **Potential Approach**:
     - Background Haiku agent monitors for code changes
     - Generates doc update suggestions
     - Surfaces summary to main conversation
     - Human approves before committing

---

## Community Requests

### Feature Request Template

When submitting a feature request, please include:

1. **Problem**: What problem does this solve?
2. **Solution**: Proposed solution
3. **Alternatives**: Other approaches considered
4. **Priority**: How important is this to you?
5. **Use Case**: Describe your use case

### Submitted Requests

#### Request #1: Dark Mode
**Submitted By**: Community
**Status**: 🟢 Planned for v2.1
**Description**: Dark theme for the UI

#### Request #2: Habit Notes/Journal
**Submitted By**: Community
**Status**: ✅ Partially Complete (V2)
**Description**: Add longer notes to habit completions

**V2 Implementation**:
- Notes field available on completion
- Data tracking for numeric values
- GraphView for visualization

**Future**: Rich text editor, images, longer entries

#### Request #3: Pomodoro Timer Integration
**Submitted By**: Community
**Status**: 🔵 Nice to Have
**Description**: Built-in Pomodoro timer for time-based habits

**Use Case**: Track "Deep Work" sessions with timer
**Alternative**: V2 data tracking can record time spent

#### Request #4: Apple Watch App
**Submitted By**: Community
**Status**: ⚪ Deferred
**Description**: Quick check-in from Apple Watch

**Dependencies**: Requires iOS app first

---

## How to Request Features

1. **Check Existing Requests**: Search this document first
2. **Open an Issue**: Create issue on GitHub
3. **Provide Details**: Use the template above
4. **Engage**: Discuss with community
5. **Vote**: React with 👍 on issues you want

## Priority Matrix

```
High Impact, Low Effort → Do First
  - Notifications
  - Habit Tags
  - Dark Mode
  - Streaks

High Impact, High Effort → Plan Carefully
  - Cross-Platform
  - Mobile App
  - Cloud Sync

Low Impact, Low Effort → Quick Wins
  - Habit Templates
  - Export Data

Low Impact, High Effort → Reconsider
  - Custom Block Pages
  - Advanced Gamification
```

---

**Last Updated**: 2026-01-18
**Next Review**: Q2 2026
