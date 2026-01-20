# Coding Standards

This document outlines the coding standards and best practices for the Habit Tracker project.

## General Principles

1. **KISS (Keep It Simple, Stupid)**: Favor simple, readable code over clever solutions
2. **DRY (Don't Repeat Yourself)**: Extract common logic into reusable functions
3. **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until it's needed
4. **Test First**: Write tests before implementation (TDD/BDD)
5. **Type Safety**: Use TypeScript strictly, avoid `any`

## TypeScript Standards

### Type Annotations

```typescript
// Good - explicit return types
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Bad - implicit any
function calculate(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Avoid `any`

```typescript
// Good - use proper types
function processData(data: HabitLog[]): void {
  data.forEach(log => console.log(log.status));
}

// Bad - using any
function processData(data: any): void {
  data.forEach((log: any) => console.log(log.status));
}
```

### Use Interfaces and Types

```typescript
// Good - clear interfaces
interface CreateHabitRequest {
  name: string;
  description?: string;
  startTimeLocal?: string;
  deadlineLocal?: string;
  timezoneOffset?: number;
  dataTracking?: boolean;
  dataUnit?: string;
  activeDays?: number[];
}

// Use for function signatures
function createHabit(request: CreateHabitRequest): Promise<Habit> {
  // ...
}
```

## Naming Conventions

### Variables and Functions

- **camelCase** for variables and functions
- **PascalCase** for classes and types
- **UPPER_SNAKE_CASE** for constants

```typescript
// Good
const userAge = 25;
const MAX_RETRIES = 3;
function getUserById(id: string) {}
class HabitManager {}
interface UserProfile {}

// Bad
const user_age = 25;
const maxretries = 3;
function GetUserById(id: string) {}
```

### Booleans

Prefix with `is`, `has`, `should`, or `can`:

```typescript
// Good
const isActive = true;
const hasPermission = false;
const shouldUpdate = true;
const canDelete = false;

// Bad
const active = true;
const permission = false;
```

### Files and Directories

- **kebab-case** for directories: `habit-tracker/`
- **camelCase** for files: `habitManager.ts`
- **PascalCase** for components: `DailyChecklist.tsx`
- **kebab-case** for config files: `eslint.config.js`

## Code Organization

### File Structure

```typescript
// 1. Imports (external first, then internal)
import { useState } from 'react';
import type { Habit } from '@habit-tracker/shared';

// 2. Types and interfaces
interface ChecklistItemProps {
  habit: Habit;
  onComplete: (id: string, value?: number) => void;
}

// 3. Constants
const MAX_NAME_LENGTH = 100;

// 4. Main component/function
export function ChecklistItem({ habit, onComplete }: ChecklistItemProps) {
  // ...
}

// 5. Helper functions (if small and specific to this file)
function formatTime(time: string): string {
  // ...
}
```

### Function Length

- Keep functions under 50 lines
- Extract complex logic into smaller functions
- One function, one purpose

```typescript
// Good - focused functions
function validateHabitName(name: string): boolean {
  return name.length > 0 && name.length <= 100;
}

function validateTimeFormat(time: string): boolean {
  return /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(time);
}

function validateHabit(habit: CreateHabitRequest): boolean {
  return validateHabitName(habit.name) &&
    (!habit.deadlineLocal || validateTimeFormat(habit.deadlineLocal));
}

// Bad - doing too much
function validateHabit(habit: any): boolean {
  if (!habit.name || habit.name.length === 0 || habit.name.length > 100) {
    return false;
  }
  if (habit.deadlineLocal && !/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(habit.deadlineLocal)) {
    return false;
  }
  // ... more validation
  return true;
}
```

## React Best Practices

### Component Structure

```typescript
// Good structure
interface QuickAddHabitProps {
  onSuccess: () => void;
}

export function QuickAddHabit({ onSuccess }: QuickAddHabitProps) {
  // 1. State
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Hooks
  const { refresh } = useHabits();

  // 3. Event handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await habitsApi.create({ name });
      setName('');
      refresh();
      onSuccess();
    } catch (err) {
      setError('Failed to create habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Render
  return (
    <form onSubmit={handleSubmit}>
      {/* JSX */}
    </form>
  );
}
```

### Hooks

- Use custom hooks for reusable logic
- Keep hooks at the top of the component
- Don't call hooks conditionally

```typescript
// Good - custom hook
function useHabitCompletion(habitId: string) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = async (value?: number) => {
    setIsCompleting(true);
    setError(null);
    try {
      await habitsApi.complete(habitId, { value });
    } catch (err) {
      setError('Failed to complete habit');
    } finally {
      setIsCompleting(false);
    }
  };

  return { complete, isCompleting, error };
}

// Use in component
function ChecklistItem({ habit }: { habit: Habit }) {
  const { complete, isCompleting, error } = useHabitCompletion(habit.id);
  // ...
}
```

### Props Destructuring

```typescript
// Good - destructure props
function ChecklistItem({ habit, onComplete }: ChecklistItemProps) {
  return <div>{habit.name}</div>;
}

// Bad - accessing via props object
function ChecklistItem(props: ChecklistItemProps) {
  return <div>{props.habit.name}</div>;
}
```

## Error Handling

### Always Handle Errors

```typescript
// Good - proper error handling
async function fetchHabits() {
  try {
    const response = await habitsApi.getAll();
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch habits');
    }
  } catch (error) {
    console.error('Error fetching habits:', error);
    throw error;
  }
}

// Bad - no error handling
async function fetchHabits() {
  const response = await habitsApi.getAll();
  return response.data;
}
```

### Use Custom Error Classes

```typescript
// Good
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

throw new ValidationError('Invalid email format', 'email');
```

## Async/Await

### Prefer async/await over Promises

```typescript
// Good
async function createHabit(data: CreateHabitRequest): Promise<Habit> {
  const response = await habitsApi.create(data);
  return response.data;
}

// Bad
function createHabit(data: CreateHabitRequest): Promise<Habit> {
  return habitsApi.create(data).then(response => response.data);
}
```

## Comments

### When to Comment

- **DO**: Explain WHY, not WHAT
- **DON'T**: State the obvious
- **DO**: Document complex algorithms
- **DON'T**: Comment bad code, refactor instead

```typescript
// Good - explains why
// Convert to UTC because database stores all times in UTC
const deadlineUtc = localTimeToUtc(deadlineLocal, timezoneOffset);

// Bad - states the obvious
// Set name to the name value
const name = habitData.name;

// Good - documents complex logic
/**
 * Converts local time to UTC accounting for timezone offset.
 * Handles edge cases where conversion crosses day boundary.
 */
function localTimeToUtc(time: string, offset: number): string {
  // ...
}
```

### JSDoc for Public APIs

```typescript
/**
 * Creates a new habit with the given parameters.
 *
 * @param request - The habit creation request containing name, deadline, etc.
 * @returns Promise resolving to the created habit
 * @throws {ValidationError} If request validation fails
 */
export async function createHabit(
  request: CreateHabitRequest
): Promise<Habit> {
  // ...
}
```

## Testing Standards

### Test Structure (AAA Pattern)

```typescript
it('should mark habit as completed', async () => {
  // Arrange
  const habit = await createTestHabit();

  // Act
  const result = await completeHabit(habit.id);

  // Assert
  expect(result.status).toBe('completed');
});
```

### Test Naming

```typescript
// Good - describes what and when
it('should return 404 when habit does not exist', () => {});
it('should create backup before modifying hosts file', () => {});
it('should block all configured websites when habit is incomplete', () => {});

// Bad - unclear
it('works', () => {});
it('test habit creation', () => {});
```

## Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Build tasks, dependencies, etc.

### Examples

```
feat(habits): add data tracking support

Add ability to track numeric values for habits with
configurable units (minutes, pages, reps, etc.).

Closes #123
```

```
fix(daemon): prevent concurrent hosts file modifications

Add file locking to prevent race conditions when multiple
processes try to modify the hosts file simultaneously.

Fixes #456
```

## Code Review Checklist

Before submitting code for review:

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Code follows style guidelines
- [ ] Functions are focused and under 50 lines
- [ ] No `any` types
- [ ] Error handling in place
- [ ] Comments explain WHY, not WHAT
- [ ] No console.log statements (use proper logging)
- [ ] No hardcoded values (use constants)
- [ ] Edge cases handled
- [ ] Performance considered
- [ ] Security vulnerabilities checked

## Performance Guidelines

### Avoid Premature Optimization

```typescript
// Good - readable first
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Only optimize if profiling shows it's a bottleneck
```

### Memoization When Needed

```typescript
// Good - memoize expensive calculations
const memoizedStats = useMemo(() => {
  return calculateComplexStats(habits);
}, [habits]);

// Don't memoize everything
const name = habit.name; // No need to memoize
```

## Security Best Practices

### Input Validation

```typescript
// Always validate user input
const habitSchema = z.object({
  name: z.string().min(1).max(100),
  startTimeLocal: z.string().regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/).optional(),
  deadlineLocal: z.string().regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/).optional(),
  dataTracking: z.boolean().optional(),
  dataUnit: z.string().max(20).optional(),
  activeDays: z.array(z.number().min(0).max(6)).optional(),
});

const validatedData = habitSchema.parse(req.body);
```

### Never Trust Client Data

```typescript
// Good - validate on server
app.post('/api/habits', (req, res) => {
  const validated = createHabitSchema.parse(req.body);
  // ... use validated data
});

// Bad - trust client
app.post('/api/habits', (req, res) => {
  const habit = req.body; // Could be anything!
  db.insert(habits).values(habit);
});
```

### Sanitize Output

```typescript
// Good - prevent XSS
function displayHabitName(name: string): string {
  return name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Or use a library like DOMPurify
```

## Accessibility

### Semantic HTML

```tsx
// Good
<button onClick={handleClick}>Delete</button>

// Bad
<div onClick={handleClick}>Delete</div>
```

### Labels and ARIA

```tsx
// Good
<label htmlFor="habit-name">Habit Name</label>
<input id="habit-name" type="text" />

// With ARIA when needed
<button aria-label="Close settings panel" onClick={onClose}>×</button>
```

### Keyboard Navigation

```tsx
// Good - handle keyboard events
<div
  role="checkbox"
  aria-checked={isChecked}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      handleToggle();
    }
  }}
  onClick={handleToggle}
>
  {isChecked ? '✓' : ''}
</div>
```
