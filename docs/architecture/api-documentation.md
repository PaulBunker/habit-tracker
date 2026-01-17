# API Documentation

## Base URL

Development: `http://localhost:3000/api`

## Authentication

Currently no authentication (single-user MVP).

## Response Format

All responses follow this structure:

```typescript
{
  success: boolean;
  data?: T;        // Present on success
  error?: string;  // Present on failure
}
```

## Endpoints

### Habits

#### Create Habit

Create a new daily habit.

**Endpoint:** `POST /api/habits`

**Request Body:**
```json
{
  "name": "Morning Exercise",
  "description": "Do at least 30 minutes of exercise",
  "deadlineLocal": "09:00",
  "timezoneOffset": -300,
  "blockedWebsites": ["reddit.com", "twitter.com"]
}
```

**Validation:**
- `name`: Required, max 100 characters
- `description`: Optional, max 500 characters
- `deadlineLocal`: Required, HH:MM format
- `timezoneOffset`: Required, -720 to 840 minutes
- `blockedWebsites`: Array of valid domains

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Morning Exercise",
    "description": "Do at least 30 minutes of exercise",
    "deadlineUtc": "13:00",
    "deadlineLocal": "09:00",
    "timezoneOffset": -300,
    "blockedWebsites": ["reddit.com", "twitter.com"],
    "createdAt": "2026-01-17T10:00:00.000Z",
    "isActive": true
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Habit name is required"
    }
  ]
}
```

---

#### List All Habits

Get all habits.

**Endpoint:** `GET /api/habits`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Morning Exercise",
      "description": "Do at least 30 minutes of exercise",
      "deadlineUtc": "13:00",
      "deadlineLocal": "09:00",
      "timezoneOffset": -300,
      "blockedWebsites": ["reddit.com", "twitter.com"],
      "createdAt": "2026-01-17T10:00:00.000Z",
      "isActive": true
    }
  ]
}
```

---

#### Get Habit by ID

Get a specific habit.

**Endpoint:** `GET /api/habits/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Morning Exercise",
    // ... same as create response
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "Habit not found"
}
```

---

#### Update Habit

Update an existing habit.

**Endpoint:** `PUT /api/habits/:id`

**Request Body:** (all fields optional)
```json
{
  "name": "Evening Exercise",
  "description": "Updated description",
  "deadlineLocal": "18:00",
  "timezoneOffset": -300,
  "blockedWebsites": ["reddit.com"],
  "isActive": false
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // Updated habit object
  }
}
```

---

#### Delete Habit

Delete a habit and all its logs.

**Endpoint:** `DELETE /api/habits/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Habit deleted successfully"
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "Habit not found"
}
```

---

### Habit Actions

#### Complete Habit

Mark a habit as completed for today.

**Endpoint:** `POST /api/habits/:id/complete`

**Request Body:**
```json
{
  "notes": "Great workout session!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "log-uuid",
    "habitId": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-01-17",
    "status": "completed",
    "completedAt": "2026-01-17T14:30:00.000Z",
    "notes": "Great workout session!",
    "createdAt": "2026-01-17T14:30:00.000Z"
  }
}
```

**Note:** If a log already exists for today, it will be updated.

---

#### Skip Habit

Skip a habit with a reason.

**Endpoint:** `POST /api/habits/:id/skip`

**Request Body:**
```json
{
  "skipReason": "Feeling unwell",
  "notes": "Will resume tomorrow"
}
```

**Validation:**
- `skipReason`: Required, max 500 characters
- `notes`: Optional, max 500 characters

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "log-uuid",
    "habitId": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-01-17",
    "status": "skipped",
    "skipReason": "Feeling unwell",
    "notes": "Will resume tomorrow",
    "createdAt": "2026-01-17T14:30:00.000Z"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Skip reason is required"
}
```

---

#### Get Habit Logs

Get completion history for a habit.

**Endpoint:** `GET /api/habits/:id/logs`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid-1",
      "habitId": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2026-01-17",
      "status": "completed",
      "completedAt": "2026-01-17T08:45:00.000Z",
      "notes": "Morning session",
      "createdAt": "2026-01-17T08:45:00.000Z"
    },
    {
      "id": "log-uuid-2",
      "habitId": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2026-01-16",
      "status": "skipped",
      "skipReason": "Injured ankle",
      "createdAt": "2026-01-16T09:00:00.000Z"
    },
    {
      "id": "log-uuid-3",
      "habitId": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2026-01-15",
      "status": "missed",
      "createdAt": "2026-01-15T09:01:00.000Z"
    }
  ]
}
```

---

### System Status

#### Get Status

Get current daemon and blocking status.

**Endpoint:** `GET /api/status`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "lastCheck": "2026-01-17T10:30:00.000Z",
    "blockedDomains": ["reddit.com", "twitter.com", "youtube.com"]
  }
}
```

---

#### Trigger Daemon Sync

Manually trigger daemon to check habits and update blocking.

**Endpoint:** `POST /api/daemon/sync`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Sync triggered successfully"
}
```

**Note:** Daemon will process on next cycle (within 60 seconds).

---

### Health Check

#### Server Health

Check if server is running.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-01-17T10:00:00.000Z"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid input or validation error |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error - Unexpected server error |

## Rate Limiting

Currently no rate limiting (single-user app).

## CORS

Development: Allows `http://localhost:5173`
Production: Configure based on deployment

## Timezone Handling

- All times stored in UTC
- `deadlineLocal` converted to `deadlineUtc` on server
- `timezoneOffset` in minutes from UTC
  - Example: EST (UTC-5) = -300
  - Example: PST (UTC-8) = -480
  - Example: IST (UTC+5:30) = 330

## Examples

### Creating a Habit with Fetch

```javascript
const response = await fetch('http://localhost:3000/api/habits', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Reading',
    description: 'Read for 30 minutes',
    deadlineLocal: '21:00',
    timezoneOffset: -new Date().getTimezoneOffset(),
    blockedWebsites: ['twitter.com', 'reddit.com'],
  }),
});

const data = await response.json();
console.log(data);
```

### Completing a Habit with Fetch

```javascript
const response = await fetch(`http://localhost:3000/api/habits/${habitId}/complete`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    notes: 'Finished a great book!',
  }),
});

const data = await response.json();
console.log(data);
```

### Getting All Habits with Axios

```javascript
import axios from 'axios';

const { data } = await axios.get('http://localhost:3000/api/habits');
console.log(data.data); // Array of habits
```
