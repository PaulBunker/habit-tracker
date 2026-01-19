# @habit-tracker/frontend

React + Vite web application for the Habit Tracker. Provides the user interface for managing habits, viewing progress, and configuring settings.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app component with routing |
| `src/api/client.ts` | API client for backend communication |
| `src/hooks/useHabits.ts` | Hook for fetching and managing habits |
| `src/hooks/useTodayLogs.ts` | Hook for today's completion logs |
| `src/components/DailyChecklist.tsx` | Main habit list with checkboxes |
| `src/components/QuickAddHabit.tsx` | Quick habit creation form |
| `src/components/HabitSettingsPanel.tsx` | Habit configuration modal |
| `src/pages/GlobalSettings.tsx` | Blocked websites configuration |

## Components

### Core Components

| Component | Description |
|-----------|-------------|
| `DailyChecklist` | Lists today's habits with completion status |
| `ChecklistItem` | Individual habit row with actions |
| `QuickAddHabit` | Single-field habit creation |
| `HabitSettingsPanel` | Full habit configuration (deadline, tracking, etc.) |
| `EmergencyResetButton` | Unblock all websites immediately |

### Data Visualization

| Component | Description |
|-----------|-------------|
| `CalendarView` | Monthly calendar showing completion history |
| `GraphView` | Charts for data-tracking habits |

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `HomePage` | Main daily checklist view |
| `/settings` | `GlobalSettings` | Configure blocked websites |

## Development

```bash
# Start development server (port 5174)
npm run dev -w @habit-tracker/frontend

# Build for production
npm run build -w @habit-tracker/frontend

# Run tests
npm test -w @habit-tracker/frontend

# Type check
npm run typecheck -w @habit-tracker/frontend
```

## Architecture

The frontend uses a simple data-fetching pattern:

1. **Hooks** manage data fetching and state (`useHabits`, `useTodayLogs`)
2. **API Client** handles HTTP requests to the backend
3. **Components** render UI and dispatch actions

State is primarily server-driven - after any mutation, hooks refetch data to ensure consistency.

### Data Flow

```
User Action → Component → API Client → Backend
                ↓
           Hook refresh → Component re-render
```

## Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_URL` | `http://localhost:3001` | `http://localhost:3000` |
