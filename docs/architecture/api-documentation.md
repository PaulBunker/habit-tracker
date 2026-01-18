# API Documentation

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3001/api` |
| Production | `http://localhost:3000/api` |

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
  "startTimeLocal": "07:00",
  "deadlineLocal": "09:00",
  "timezoneOffset": -300,
  "dataTracking": true,
  "dataUnit": "minutes",
  "activeDays": [1, 2, 3, 4, 5]
}
```

**Validation:**
- `name`: Required, max 100 characters
- `description`: Optional, max 500 characters
- `startTimeLocal`: Optional, HH:MM format (when blocking starts)
- `deadlineLocal`: Optional, HH:MM format (when marked as missed)
- `timezoneOffset`: Optional, -720 to 840 minutes (defaults to 0)
- `dataTracking`: Optional, boolean (enables value tracking)
- `dataUnit`: Optional, max 20 characters (e.g., "minutes", "pages")
- `activeDays`: Optional, array of day indices (0=Sunday, 6=Saturday)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Morning Exercise",
    "description": "Do at least 30 minutes of exercise",
    "startTimeUtc": "11:00",
    "deadlineUtc": "13:00",
    "timezoneOffset": -300,
    "dataTracking": true,
    "dataUnit": "minutes",
    "activeDays": "[1,2,3,4,5]",
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
      "startTimeUtc": "11:00",
      "deadlineUtc": "13:00",
      "timezoneOffset": -300,
      "dataTracking": true,
      "dataUnit": "minutes",
      "activeDays": "[1,2,3,4,5]",
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
  "startTimeLocal": "17:00",
  "deadlineLocal": "18:00",
  "timezoneOffset": -300,
  "dataTracking": false,
  "dataUnit": null,
  "activeDays": [0, 1, 2, 3, 4, 5, 6],
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
  "notes": "Great workout session!",
  "value": 45
}
```

**Fields:**
- `notes`: Optional, completion notes
- `value`: Optional, tracked value (when dataTracking is enabled)

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
    "value": 45,
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
      "value": 45,
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

### Settings (V2 Global Blocking)

V2 uses global blocked websites instead of per-habit blocking.

#### Get Settings

Get global settings including blocked websites.

**Endpoint:** `GET /api/settings`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "blockedWebsites": ["reddit.com", "twitter.com", "youtube.com"],
    "timezone": "America/New_York"
  }
}
```

---

#### Update Settings

Update global settings.

**Endpoint:** `PUT /api/settings`

**Request Body:**
```json
{
  "blockedWebsites": ["reddit.com", "twitter.com"],
  "timezone": "America/Los_Angeles"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "blockedWebsites": ["reddit.com", "twitter.com"],
    "timezone": "America/Los_Angeles"
  }
}
```

---

#### Add Blocked Website

Add a website to the blocked list.

**Endpoint:** `POST /api/settings/blocked-websites`

**Request Body:**
```json
{
  "website": "instagram.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "blockedWebsites": ["reddit.com", "twitter.com", "instagram.com"]
  }
}
```

---

#### Remove Blocked Website

Remove a website from the blocked list.

**Endpoint:** `DELETE /api/settings/blocked-websites`

**Request Body:**
```json
{
  "website": "twitter.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "blockedWebsites": ["reddit.com", "instagram.com"]
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "Website not found in blocked list"
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
    "lastCheck": "2026-01-17T10:30:00.000Z"
  }
}
```

---

#### Trigger Daemon Sync

Manually trigger daemon to refresh blocking state.

**Endpoint:** `POST /api/daemon/sync`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Daemon refresh triggered"
}
```

**Error Response:** (daemon not running)
```json
{
  "success": false,
  "message": "Daemon not reachable"
}
```

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

| Environment | Allowed Origin |
|-------------|----------------|
| Development | `http://localhost:5174` |
| Production | `http://localhost:5173` |

## Timezone Handling

- All times stored in UTC
- `startTimeLocal` and `deadlineLocal` converted to UTC on server
- `timezoneOffset` in minutes from UTC
  - Example: EST (UTC-5) = -300
  - Example: PST (UTC-8) = -480
  - Example: IST (UTC+5:30) = 330

## Examples

### Creating a Habit with Fetch

```javascript
const response = await fetch('http://localhost:3001/api/habits', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Reading',
    description: 'Read for 30 minutes',
    startTimeLocal: '20:00',
    deadlineLocal: '21:00',
    timezoneOffset: -new Date().getTimezoneOffset(),
    dataTracking: true,
    dataUnit: 'pages',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
  }),
});

const data = await response.json();
console.log(data);
```

### Completing a Habit with Tracked Value

```javascript
const response = await fetch(`http://localhost:3001/api/habits/${habitId}/complete`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    notes: 'Finished a great chapter!',
    value: 25,
  }),
});

const data = await response.json();
console.log(data);
```

### Managing Blocked Websites

```javascript
// Add a website
await fetch('http://localhost:3001/api/settings/blocked-websites', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ website: 'reddit.com' }),
});

// Remove a website
await fetch('http://localhost:3001/api/settings/blocked-websites', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ website: 'reddit.com' }),
});

// Get all settings
const { data } = await fetch('http://localhost:3001/api/settings').then(r => r.json());
console.log(data.blockedWebsites);
```

### Getting All Habits with Axios

```javascript
import axios from 'axios';

const { data } = await axios.get('http://localhost:3001/api/habits');
console.log(data.data); // Array of habits
```
