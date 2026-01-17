# Feature Requests & Roadmap

This document tracks feature requests, enhancements, and the product roadmap for Habit Tracker.

## Status Labels

- 🟢 **Planned**: Scheduled for upcoming release
- 🟡 **Under Consideration**: Being evaluated
- 🔵 **Nice to Have**: Would be good but not prioritized
- ⚪ **Deferred**: Not in current roadmap

## Version 1.0 (MVP) - Current

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

### Known Limitations

- macOS only
- Single user
- Daily habits only
- No real-time updates
- No mobile app
- No cloud sync

---

## Version 1.1 - Quick Wins

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

**User Stories**:
```gherkin
Feature: Habit Streaks
  Scenario: Build a streak by completing habits
    Given I have a habit "Daily Exercise"
    When I complete it for 5 consecutive days
    Then I should see a streak of 5 days
    And a streak indicator should be displayed
```

#### 2. Habit Categories/Tags 🟢
**Priority**: Medium
**Effort**: Low
**Description**: Organize habits with tags/categories

**Requirements**:
- Add tags to habits (e.g., "Health", "Work", "Learning")
- Filter habits by tag
- Color-code tags
- Multiple tags per habit

**UI Mockup**:
```
┌─────────────────────────────┐
│ Morning Exercise  🏃 Health │
│ Deadline: 09:00             │
│ Tags: [Health] [Fitness]    │
└─────────────────────────────┘
```

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

#### 4. Quick Stats Dashboard 🟢
**Priority**: Medium
**Effort**: Low
**Description**: Enhanced dashboard with weekly/monthly views

**Requirements**:
- Completion rate (this week/month)
- Habits completed today
- Most consistent habit
- Heat map calendar view

---

## Version 1.2 - Enhanced Functionality

**Status**: 🟡 Under Consideration

**Target**: Q2 2026

### Features

#### 5. Weekly Habits 🟡
**Priority**: High
**Effort**: High
**Description**: Support for habits with weekly frequency

**Requirements**:
- Specify days of week (e.g., Mon/Wed/Fri)
- Different deadlines per day
- Streak calculation accounts for off-days

**Data Model Changes**:
```typescript
interface Habit {
  // ... existing fields
  frequency: 'daily' | 'weekly' | 'custom';
  weeklySchedule?: {
    monday?: string;    // HH:MM deadline
    tuesday?: string;
    // ...
  };
}
```

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

**Requirements**:
- Browse template library
- One-click to add template
- Customize after adding

#### 8. Habit Dependencies 🔵
**Priority**: Low
**Effort**: High
**Description**: Create chains of habits

**Example**:
- "Breakfast" must be completed before "Vitamins"
- "Morning Routine" includes 3 sub-habits

**UI**:
```
Morning Routine ✓
  ├─ Meditation ✓
  ├─ Exercise ✓
  └─ Journaling ⏳
```

---

## Version 2.0 - Multi-Platform & Cloud

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

**Technical Challenges**:
- Windows hosts file permissions
- Different service management per OS
- Testing across platforms

#### 10. Cloud Sync ⚪
**Priority**: High
**Effort**: Very High
**Description**: Sync habits across devices

**Requirements**:
- Cloud backend (Firebase/Supabase)
- Real-time sync
- Conflict resolution
- Offline support

**Infrastructure**:
- User authentication
- Cloud database
- WebSocket for real-time updates
- Mobile app support

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

**Tech Stack Options**:
- React Native (code reuse)
- Flutter (better performance)
- Native (best UX, more work)

#### 12. Browser Extension ⚪
**Priority**: Medium
**Effort**: High
**Description**: Chrome/Firefox extension for blocking

**Advantages over hosts file**:
- More granular control
- Easier installation
- Can block specific pages
- Custom block pages with motivation

**Features**:
- Sync with desktop app
- Custom block messages
- Temporary bypass with reason
- Usage analytics

---

## Version 3.0 - Social & Gamification

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

**Privacy**:
- Opt-in sharing
- Private by default
- Choose what to share

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

**Achievements**:
- "First Steps" - Complete first habit
- "Week Warrior" - 7-day streak
- "Century" - 100 total completions
- "Perfectionist" - 30-day streak
- "Early Bird" - Complete habit before 6 AM

#### 15. Data Export & Analytics ⚪
**Priority**: Low
**Effort**: Medium
**Description**: Export data and advanced analytics

**Export Formats**:
- CSV
- JSON
- PDF report

**Analytics**:
- Completion trends
- Best/worst days
- Correlation analysis
- Time of day patterns
- Predictive insights

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
**Status**: 🟢 Planned for v1.1
**Description**: Dark theme for the UI

**Implementation**:
- Toggle in settings
- Persist preference
- System preference detection
- Smooth transitions

#### Request #2: Habit Notes/Journal
**Submitted By**: Community
**Status**: 🟡 Under Consideration
**Description**: Add longer notes to habit completions

**Current**: Notes field with 500 char limit
**Requested**: Rich text editor, images, longer entries

**Evaluation**:
- May be scope creep (separate journaling app?)
- Could add as "habit reflection" feature
- Need more user feedback

#### Request #3: Pomodoro Timer Integration
**Submitted By**: Community
**Status**: 🔵 Nice to Have
**Description**: Built-in Pomodoro timer for time-based habits

**Use Case**: Track "Deep Work" sessions with timer
**Complexity**: High - requires significant UI changes
**Alternative**: Recommend external Pomodoro apps

#### Request #4: Apple Watch App
**Submitted By**: Community
**Status**: ⚪ Deferred
**Description**: Quick check-in from Apple Watch

**Dependencies**: Requires iOS app first
**Effort**: Very High
**Timeline**: Post-v2.0

---

## Technical Debt

### Refactoring Needs

1. **Improve Error Messages**
   - More specific validation errors
   - User-friendly language
   - Actionable suggestions

2. **Add Loading States**
   - Skeleton screens
   - Progress indicators
   - Better UX during async operations

3. **Optimize Database Queries**
   - Add indexes
   - Use database views
   - Cache frequently accessed data

4. **Improve Daemon Efficiency**
   - Only check changed habits
   - Debounce rapid changes
   - Better error recovery

5. **Accessibility Audit**
   - Screen reader support
   - Keyboard navigation
   - WCAG 2.1 AA compliance

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

High Impact, High Effort → Plan Carefully
  - Weekly Habits
  - Cross-Platform
  - Mobile App

Low Impact, Low Effort → Quick Wins
  - Habit Templates
  - Export Data

Low Impact, High Effort → Reconsider
  - Custom Block Pages
  - Advanced Gamification
```

---

**Last Updated**: 2026-01-17
**Next Review**: Q2 2026
