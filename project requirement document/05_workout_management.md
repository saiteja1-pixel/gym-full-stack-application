# Project Requirements Document - Workout Management Module

## 1. Module Overview & Objectives
The Workout Management Module allows trainers to build and assign custom workout plans, and enables members to track, view, and mark their workout routines as completed.

The key objectives are to:
- Standardize routine setups with explicit parameters (sets, reps, targets, weight metrics).
- Provide structural instruction via video demonstration URLs and trainer notes.
- Track members' completion rates.
- Gather member feedback (exertion levels, weight suggestions) for future plan adjustments.

---

## 2. User Roles & Permissions
- **Trainer**: Can create, edit, delete, and assign workout plans to members. Trainers can view historical completion logs and feedback submitted by members.
- **Member**: Can view active routines, mark individual exercises and workouts as completed, watch instruction videos, and submit performance notes. Members *cannot* modify baseline workout assignments.
- **Admin**: Can view workout assignments and performance logs.

---

## 3. Database Schema Mapping
This module utilizes the following database entities defined in the schema:

### 3.1 WorkoutPlan Model
The main template container for a routine.
- `id` (String, Primary Key)
- `trainerId` (String, ForeignKey linked to Trainer)
- `title` (String, e.g. "5-Day Hypertrophy Split")
- `description` (String, Optional)
- `exercises` (Relation link to `WorkoutExercise` children array)
- `assignments` (Relation link to `WorkoutAssignment` instances)

### 3.2 WorkoutExercise Model
Stores specific exercise lines.
- `id` (String, Primary Key)
- `workoutPlanId` (String, ForeignKey linked to WorkoutPlan)
- `exerciseName` (String, e.g. "Flat Bench Press")
- `sets` (Int)
- `reps` (Int)
- `targetWeight` (Float, targets in kg)
- `videoUrl` (String, Optional link to YouTube/storage demo)
- `notes` (String, Optional execution instructions)

### 3.3 WorkoutAssignment Model
Bridges plans with target members.
- `id` (String, Primary Key)
- `workoutPlanId` (String, ForeignKey linked to WorkoutPlan)
- `memberId` (String, ForeignKey linked to Member)
- `assignedDate` (DateTime, tracks configuration date)
- `isActive` (Boolean, tracks if active or archived)

### 3.4 WorkoutProgress Model
Records completion logs.
- `id` (String, Primary Key)
- `memberId` (String, ForeignKey linked to Member)
- `assignmentId` (String, ForeignKey linked to WorkoutAssignment)
- `logDate` (DateTime, tracks completion timestamp)
- `completed` (Boolean, tracks if the workout was completed)
- `feedback` (String, logs member feedback)

---

## 4. Frontend Route Structure
- **Trainer Editor Panel**: `[trainer/members/[id]/workouts/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/trainer/members/%5Bid%5D/workouts/page.tsx)`: Interactive drag-and-drop table grid to customize routines.
- **Member Dashboard Panel**: `[member/workouts/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/member/workouts/page.tsx)`: Checklist interface with watch demo triggers, set calculators, and workout submission tools.

---

## 5. Detailed Functional Specifications

### 5.1 Trainer Workout Builder
- **Bulk Builder Interface**: Trainers can add multiple exercise lines. Each line features inline controls:
  - Exercise search/autoselect input.
  - Sets and reps numeric counters.
  - Target Weight (kg) entry field.
  - Demonstration video URL validation.
  - Execution instructions text input.
- **Assignment Trigger**: Allows picking one or multiple assigned members to roll out the plan in a single transaction.

### 5.2 Member Tracker Panel
- **Workout Overview**: Displays today's active plan title and details.
- **Checklist Engine**:
  - Exercises are displayed as glassmorphic checklist rows.
  - Members click a checkbox to mark an exercise as completed. This triggers a subtle success animation.
  - Clickable icon launcher opening a modal popup to watch form videos.
- **Completion Feed**:
  - Displays a progress bar indicating completion percentage (e.g., "3 of 6 exercises completed").
  - "Submit Workout" button is enabled once all exercises are checked off.
  - Submitting opens a modal feedback text field (e.g., "Felt heavy in sets 3-4").

---

## 6. API Specifications

### 6.1 Create & Assign Workout Plan (`POST /api/fitness/workouts`)
- **Headers**: `Authorization: Bearer <Token>` (Role: `TRAINER`)
- **Request Body**:
  ```json
  {
    "memberId": "member-uuid-abc",
    "title": "Lower Body Power A",
    "description": "Quadriceps and calves focus",
    "exercises": [
      {
        "exerciseName": "Barbell Squat",
        "sets": 4,
        "reps": 8,
        "targetWeight": 100.0,
        "videoUrl": "https://storage.supabase.co/videos/squat.mp4",
        "notes": "Go parallel or below"
      },
      {
        "exerciseName": "Leg Extensions",
        "sets": 3,
        "reps": 12,
        "targetWeight": 45.0,
        "notes": "Hold squeeze at peak contraction for 1 sec"
      }
    ]
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "assignmentId": "assignment-uuid-111"
  }
  ```

### 6.2 Fetch Active Member Workouts (`GET /api/fitness/workouts`)
- **Query Parameters**: `memberId=member-uuid-abc`
- **Success Response (200)**:
  ```json
  {
    "activeWorkout": {
      "assignmentId": "assignment-uuid-111",
      "title": "Lower Body Power A",
      "description": "Quadriceps and calves focus",
      "exercises": [
        {
          "id": "ex-1",
          "exerciseName": "Barbell Squat",
          "sets": 4,
          "reps": 8,
          "targetWeight": 100.0,
          "videoUrl": "https://storage.supabase.co/videos/squat.mp4",
          "notes": "Go parallel or below"
        }
      ]
    }
  }
  ```

### 6.3 Submit Workout Completion Log (`POST /api/fitness/workouts/progress`)
- **Request Body**:
  ```json
  {
    "memberId": "member-uuid-abc",
    "assignmentId": "assignment-uuid-111",
    "completed": true,
    "feedback": "Squats felt strong. Managed all reps with good form."
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "logId": "progress-log-uuid"
  }
  ```

---

## 7. Edge Cases & Client-Side Design Enhancements
- **Exercise Completion States**: Ensure checked-off exercises remain checked off on page reload using persistent local state, resetting only on day change.
- **Empty Workout State**: If no workout is assigned for the day, show a resting state with a clean glass panel and the message: "Rest Day. Relax and recover."
- **Video Overlays**: Video links must play inside a styled inline overlay modal using absolute positioning to avoid navigating away from the checklist.
- **Framer Motion Checklist Transitions**: Apply layout shifts when checking items off:
  ```typescript
  export const listItemTransition = {
    layout: { type: "spring", stiffness: 600, damping: 30 }
  };
  ```
