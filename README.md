# SlotSwapper 🔄

A peer-to-peer time-slot scheduling application that enables users to swap time slots with each other seamlessly. SlotSwapper allows users to manage their calendars and swap time slots with other users. Users can mark their busy slots as "swappable," browse available slots from others, and request swaps. When a swap is accepted, the calendars are automatically updated for both parties.

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes

### Key Features

- **User Authentication**: Secure JWT-based signup and login
- **Calendar Management**: Create, view, update, and delete time slots
- **Slot Status Management**: Mark slots as BUSY, SWAPPABLE, or SWAP_PENDING
- **Marketplace**: Browse swappable slots from other users
- **Swap Requests**: Send and receive swap requests
- **Real-time Updates**: Automatic calendar updates upon swap acceptance
- **Transaction Safety**: Database transactions ensure data consistency

## 🏗️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **date-fns** for date formatting
- **Vite** as build tool

### Backend
- **Node.js** with Express
- **PostgreSQL** for database (recommended)
- **JSON Web Tokens (JWT)** for authentication
- **bcryptjs** for password hashing
- **Zod** for request validation
- **TypeScript** for type safety

### Why PostgreSQL?

PostgreSQL is recommended for this application because:
1. **ACID Compliance**: Ensures data consistency during swap transactions
2. **Advanced Locking**: Row-level locking prevents race conditions
3. **Transaction Support**: Critical for the atomic swap operation
4. **Enum Types**: Native support for status enums
5. **Mature Ecosystem**: Reliable, well-documented, and widely supported
6. **Performance**: Excellent for read-heavy operations (browsing marketplace)

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Supabase Account** (free cloud PostgreSQL) OR Local PostgreSQL (v14+)

## 🚀 Quick Start

**Want to get up and running quickly?** 

**See [QUICKSTART.md](QUICKSTART.md)** for step-by-step setup instructions (5 minutes!)

## 📡 API Documentation

### Postman Collection

**Quick Testing**: Import the included Postman collection for instant API testing!

- 📁 **`SlotSwapper_API.postman_collection.json`** - Complete API collection (12 endpoints)
- 🌍 **`SlotSwapper.postman_environment.json`** - Environment variables

**Features:**
- ✅ Automatic token management (saves token from login)
- ✅ Auto-saves IDs (userId, eventId, swapRequestId)
- ✅ Pre-configured requests for all endpoints
- ✅ Organized into folders (Auth, Events, Swaps)

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### POST `/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-01-01T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/auth/login`
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-01-01T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET `/auth/me`
Get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

### Event Endpoints

All event endpoints require authentication (Bearer token).

#### GET `/events`
Get all events for the authenticated user.

**Response (200):**
```json
{
  "events": [
    {
      "id": 1,
      "title": "Team Meeting",
      "startTime": "2025-01-10T10:00:00Z",
      "endTime": "2025-01-10T11:00:00Z",
      "status": "BUSY",
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ]
}
```

#### POST `/events`
Create a new event.

**Request Body:**
```json
{
  "title": "Focus Block",
  "startTime": "2025-01-11T14:00:00Z",
  "endTime": "2025-01-11T15:00:00Z"
}
```

**Response (201):**
```json
{
  "event": {
    "id": 2,
    "title": "Focus Block",
    "startTime": "2025-01-11T14:00:00Z",
    "endTime": "2025-01-11T15:00:00Z",
    "status": "BUSY",
    "createdAt": "2025-01-01T12:30:00Z"
  }
}
```

#### PATCH `/events/:id/status`
Update an event's status.

**Request Body:**
```json
{
  "status": "SWAPPABLE"
}
```

**Response (200):**
```json
{
  "event": {
    "id": 1,
    "title": "Team Meeting",
    "startTime": "2025-01-10T10:00:00Z",
    "endTime": "2025-01-10T11:00:00Z",
    "status": "SWAPPABLE"
  }
}
```

#### DELETE `/events/:id`
Delete an event.

**Response (200):**
```json
{
  "message": "Event deleted successfully"
}
```

### Swap Endpoints

All swap endpoints require authentication.

#### GET `/swappable-slots`
Get all swappable slots from other users.

**Response (200):**
```json
{
  "slots": [
    {
      "id": 3,
      "title": "Workshop",
      "startTime": "2025-01-12T09:00:00Z",
      "endTime": "2025-01-12T10:30:00Z",
      "userId": 2,
      "userName": "Jane Smith"
    }
  ]
}
```

#### POST `/swap-request`
Create a swap request.

**Request Body:**
```json
{
  "mySlotId": 1,
  "theirSlotId": 3
}
```

**Response (201):**
```json
{
  "swapRequest": {
    "id": 1,
    "mySlotId": 1,
    "theirSlotId": 3,
    "status": "PENDING",
    "createdAt": "2025-01-05T14:00:00Z"
  }
}
```

#### POST `/swap-response/:requestId`
Respond to a swap request (accept or reject).

**Request Body:**
```json
{
  "accept": true
}
```

**Response (200):**
```json
{
  "message": "Swap request accepted",
  "swapRequest": {
    "id": 1,
    "status": "ACCEPTED"
  }
}
```

#### GET `/my-requests`
Get all swap requests (incoming and outgoing).

**Response (200):**
```json
{
  "incoming": [
    {
      "id": 1,
      "status": "PENDING",
      "createdAt": "2025-01-05T14:00:00Z",
      "theirSlot": {
        "id": 1,
        "title": "Team Meeting",
        "startTime": "2025-01-10T10:00:00Z",
        "endTime": "2025-01-10T11:00:00Z"
      },
      "mySlot": {
        "id": 3,
        "title": "Workshop",
        "startTime": "2025-01-12T09:00:00Z",
        "endTime": "2025-01-12T10:30:00Z"
      },
      "requester": {
        "id": 1,
        "name": "John Doe"
      }
    }
  ],
  "outgoing": []
}
```

## 🎨 Design Choices

### Architecture

1. **Separation of Concerns**: Frontend and backend are completely separate, allowing independent scaling and deployment.

2. **RESTful API Design**: Clear, predictable endpoint structure following REST principles.

3. **Type Safety**: TypeScript throughout ensures fewer runtime errors and better developer experience.

4. **Component-Based UI**: React components are modular and reusable.

### Security

1. **JWT Authentication**: Stateless authentication that scales well.
2. **Password Hashing**: bcrypt with salt rounds for secure password storage.
3. **SQL Injection Protection**: Parameterized queries prevent SQL injection.
4. **CORS**: Configurable CORS to restrict API access.

### Database Design

1. **Normalized Schema**: Three main tables (Users, Events, SwapRequests) with proper foreign keys.
2. **Enums for Status**: Type-safe status management at database level.
3. **Indexes**: Strategic indexes on frequently queried columns.
4. **Cascading Deletes**: Automatic cleanup of related records.

#### Database Schema

**Users Table**
- `id` (Primary Key)
- `name`, `email`, `password_hash`
- `created_at`, `updated_at`

**Events Table**
- `id` (Primary Key)
- `title`, `start_time`, `end_time`
- `status` (ENUM: BUSY, SWAPPABLE, SWAP_PENDING)
- `user_id` (Foreign Key → Users)
- `created_at`, `updated_at`

**Swap Requests Table**
- `id` (Primary Key)
- `requester_id`, `requester_event_id`
- `receiver_id`, `receiver_event_id`
- `status` (ENUM: PENDING, ACCEPTED, REJECTED)
- `created_at`, `updated_at`

### Swap Transaction Logic

The core swap logic is implemented with **database transactions** to ensure atomicity:

```typescript
// Simplified version
await client.query('BEGIN');
try {
  // 1. Lock both events
  // 2. Verify both are SWAPPABLE
  // 3. Create swap request (PENDING)
  // 4. Update both to SWAP_PENDING
  await client.query('COMMIT');
} catch {
  await client.query('ROLLBACK');
}
```

When accepting:
```typescript
// 1. Verify request is PENDING
// 2. Swap the user_id of both events
// 3. Set both statuses to BUSY
// 4. Mark request as ACCEPTED
```

This ensures **no race conditions** and **data consistency**.

## 🧪 Testing

### Using Postman

Import the provided Postman collection files for API testing:
- **`SlotSwapper_API.postman_collection.json`** - Complete collection with all endpoints
- **`SlotSwapper.postman_environment.json`** - Environment variables

The collection includes automatic token management and pre-configured requests for all endpoints.

### Manual Testing Flow (End-to-End)

1. **User Registration**:
   - Sign up as User A and User B (use different browsers or incognito)

2. **Create Events**:
   - User A creates "Team Meeting" on Tuesday 10-11 AM
   - User B creates "Focus Block" on Wednesday 2-3 PM

3. **Make Swappable**:
   - Both users mark their events as "Swappable"

4. **Browse Marketplace**:
   - User A navigates to Marketplace
   - Should see User B's "Focus Block"

5. **Request Swap**:
   - User A clicks "Request Swap"
   - Selects their "Team Meeting"
   - Confirms

6. **Check Requests**:
   - User B navigates to Requests
   - Should see incoming request
   - Clicks "Accept"

7. **Verify Calendar**:
   - User A's calendar now shows "Focus Block" on Wednesday
   - User B's calendar now shows "Team Meeting" on Tuesday

## 🚧 Challenges & Solutions

### Challenge 1: Race Conditions
**Problem**: Multiple users requesting the same slot simultaneously.

**Solution**: Database row-level locking with `FOR UPDATE` in transactions.

### Challenge 2: Orphaned Pending Slots
**Problem**: If a swap is rejected, slots should become swappable again.

**Solution**: Status management in `respondToSwapRequest` explicitly handles both accept and reject cases.

### Challenge 3: Date/Time Handling
**Problem**: JavaScript dates and PostgreSQL timestamps need careful handling.

**Solution**: Store as ISO 8601 strings in database, use `date-fns` for formatting in frontend.

### Challenge 4: Authentication State
**Problem**: Maintaining auth state across page refreshes.

**Solution**: Store JWT and user in localStorage, check on app mount.

## 🔮 Future Enhancements

- [ ] **WebSocket Integration**: Real-time notifications for swap requests
- [ ] **Calendar Integration**: Sync with Google Calendar, Outlook
- [ ] **Recurring Events**: Support for repeating time slots
- [ ] **Swap Suggestions**: AI-powered suggestions based on user preferences
- [ ] **Email Notifications**: Email alerts for swap requests
- [ ] **User Profiles**: Extended user information and preferences
- [ ] **Search & Filters**: Filter marketplace by time, duration, etc.

**Built with ❤️ using React, TypeScript, Node.js, and PostgreSQL**
