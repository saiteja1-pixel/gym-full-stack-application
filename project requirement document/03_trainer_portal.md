# Project Requirements Document - Trainer Portal

## 1. Module Overview & Objectives
The Trainer Portal enables fitness trainers to manage their assigned members, track physical transformations, configure workouts, and plan customized diet menus. 

The key objectives are to:
- Provide a clean summary view of all members assigned to the trainer.
- Streamline updating member body metrics (weight, body fat, circumference parameters).
- Enable building and scheduling workout routines containing target sets, reps, and tutorial links.
- Facilitate drafting customized diet plans matching daily calorie and macronutrient (proteins, carbs, fats) metrics.
- Ensure total privacy separation: Trainers *must not* access membership prices, revenue data, billing ledgers, or payment transactions.

---

## 2. User Roles & Permissions
- **Trainer**: Can view their assigned members, create workout plans, assign workouts, configure diet plans, and insert physical measurements. Trainers cannot register new members, alter membership plans, view financial analytics, delete profiles, or edit system admin configurations.
- **Admin**: Can assign members to trainers and inspect trainer schedules.

---

## 3. Database Schema Mapping
The Trainer Portal reads and writes data via the following Prisma models:
- **Trainer**: Stores trainer name, specialty, bio description, avatar URL, and assigned member array relationships.
- **Member**: Accesses personal baseline variables (initial height, initial weight) and links to metrics logs.
- **BodyMeasurement**: Writes historical measurement logs (weight, height, BMI, body fat %, body circumferences).
- **WorkoutPlan & WorkoutExercise**: Configures workout plans containing individual exercise details.
- **WorkoutAssignment**: Maps active workout plans to members for designated schedules.
- **DietPlan**: Configures macro splits and lists daily meal choices (breakfast, lunch, dinner, snacks).

---

## 4. Frontend Route Structure
Trainers access their specific workflows under the `/trainer` folder structure in the Next.js App Router:
- `[trainer/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/trainer/page.tsx)`: Trainer Dashboard. Lists assigned members, search tools, and shortcut buttons to add updates.
- `[trainer/members/[id]/measurements/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/trainer/members/%5Bid%5D/measurements/page.tsx)`: Detailed physical measurement logging forms and comparative charts.
- `[trainer/members/[id]/workouts/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/trainer/members/%5Bid%5D/workouts/page.tsx)`: Workout constructor panel (adding exercises, sets, reps, target weights, form demonstration URLs).
- `[trainer/members/[id]/diet/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/trainer/members/%5Bid%5D/diet/page.tsx)`: Macro calculator and diet structure configuration forms.

---

## 5. Detailed Functional Specifications

### 5.1 Trainer Dashboard
- **Assigned Members Grid**: High-fidelity glassmorphic grid display listing assigned members. Each card displays:
  - Member name, profile picture, and ID.
  - Baseline goals (e.g., "Weight Goal: 75kg (Current: 78kg)").
  - Quick action icons: Update Metrics (ruler icon), Edit Workouts (dumbbell icon), Edit Diet (apple icon).
- **Recent Activity Alerts Feed**: Displays instant notices when a member marks a workout as complete, logs their macros, or enters new progress notes.

### 5.2 Physical Metrics Log Engine
- **Input Form**: Single-page entry layout for measurements:
  - Weight (kg), Height (cm), Body Fat (%), Chest (in), Waist (in), Hip (in), Biceps (in), Thigh (in).
  - General observations (textarea notes field).
- **Auto-Computation**: The system dynamically calculates BMI using height and weight entries before committing to the database.
- **Progress Trends**: Mini Recharts line displays within the panel showing comparative rates from the last 3 logs.

### 5.3 Workout Planning Board
- **Routines Library Selector**: Allows choosing from preconfigured workout plans or building a custom schedule.
- **Builder Grid**:
  - Add/Remove Exercise lines dynamically.
  - Input fields for target parameters: Sets (number), Reps (number), Target Weight (kg), Form Video URL, and Specific Notes (e.g., "Focus on slow eccentrics").

### 5.4 Nutrition & Macro Planner
- **Target Macro Setters**: Input sliders/fields for target parameters:
  - Target Calories (kcal), Target Protein (g), Target Carbs (g), Target Fats (g), Target Water Intake (ml).
- **Macro Split Graph**: Renders a dynamic donut preview showing macro distribution percentages (Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g).
- **Meal Text Editors**: Section templates for detailed meal lists: Breakfast, Lunch, Dinner, and Snacks.

---

## 6. API Specifications

### 6.1 Get Trainer's Members (`GET /api/trainer/members`)
- **Headers**: `Authorization: Bearer <Token>` (Role: `TRAINER`)
- **Success Response (200)**:
  ```json
  {
    "assignedMembers": [
      {
        "id": "member-uuid-1",
        "memberId": "CF-2026-0001",
        "name": "Jane Miller",
        "avatarUrl": "https://storage.supabase.co/avatars/jane.jpg",
        "initialWeight": 68.0,
        "initialHeight": 165.0,
        "latestWeight": 65.5,
        "activePlan": "Platinum Half-Year"
      }
    ]
  }
  ```

### 6.2 Log Body Metrics (`POST /api/fitness/measurements`)
- **Request Body**:
  ```json
  {
    "memberId": "member-uuid-1",
    "weight": 65.5,
    "height": 165.0,
    "bodyFat": 22.4,
    "chest": 34.0,
    "waist": 28.0,
    "hip": 36.5,
    "biceps": 11.5,
    "thigh": 21.0,
    "notes": "Good progress, body fat dropped 1% in two weeks."
  }
  ```
- **Backend Validation**: Auto-computes:
  $$\text{bmi} = \frac{65.5}{(1.65)^2} \approx 24.06$$
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "measurement": {
      "id": "measurement-log-uuid",
      "logDate": "2026-06-25T13:46:00.000Z",
      "bmi": 24.06
    }
  }
  ```

### 6.3 Assign Workout Plan (`POST /api/fitness/workouts`)
- **Request Body**:
  ```json
  {
    "memberId": "member-uuid-1",
    "title": "Hypertrophy Push Day A",
    "description": "Chest, shoulders, and triceps focus",
    "exercises": [
      {
        "exerciseName": "Incline Dumbbell Press",
        "sets": 4,
        "reps": 10,
        "targetWeight": 22.5,
        "videoUrl": "https://youtube.com/watch?v=exercise",
        "notes": "Keep shoulders retracted"
      }
    ]
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "assignmentId": "assignment-uuid-abc"
  }
  ```

---

## 7. Role-Based Access Control (RBAC) Security Safeguard
In Express.js controllers, the route files must enforce strict filters:
```javascript
// routes/trainer.js
const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Block access from non-trainers to trainer routes
router.use(authenticateJWT, requireRole(['TRAINER', 'ADMIN', 'SUPER_ADMIN']));

// Ensure trainer is blocked from hitting financial APIs
// Financial endpoints located at routes/payments.js:
// router.use('/api/payments', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN'])); // Trainer excluded!
```

---

## 8. Verification & QA Checklist
1. **Financial Lockout**: Attempt to access `/api/payments/ledger` using a Trainer's JWT. Verify the response is a strict `403 Permission Denied`.
2. **BMI Edge Cases**: Enter extreme heights (e.g. 0cm or 300cm) and confirm validators capture and handle division-by-zero errors gracefully.
3. **Draft Serialization**: Verify that multi-exercise workout inputs commit cleanly in a single bulk operation rather than causing multiple slow DB network queries.
4. **Responsive Layout**: Verify that the member grid handles scaling down gracefully, converting list arrays into vertical card layouts on tablets and phone viewports.
