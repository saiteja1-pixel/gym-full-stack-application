# Phase 5 — Trainer Portal

> **Goal:** Build the complete trainer workspace — a member grid dashboard, physical body measurement logging (auto BMI calculation), workout routine builder (exercise lists, sets/reps/weights/videos), and macronutrient diet planner. Trainers are strictly isolated from financial data.
>
> **Depends on:** Phase 1 (Auth), Phase 2 (Members assigned to trainer)

**Source PRDs:**
- [03_trainer_portal.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/03_trainer_portal.md)
- [04_diet_management.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/04_diet_management.md)
- [05_workout_management.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/05_workout_management.md)
- [06_fitness_tracking.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/06_fitness_tracking.md)
- [design.md §4.2 Fitness APIs, §5.1 Shell](file:///c:/Users/HP/Downloads/full stack application/design.md)

---

## 1. Scope & Objectives
- Trainer sees only their **assigned members** — no cross-trainer data access.
- Log **body measurements** per session (weight, height, body fat, circumferences).
- **Auto-calculate BMI** on every measurement submission.
- Build **custom workout plans** with exercises (sets, reps, target weight, tutorial video URL, notes).
- **Assign** workout plans to one or multiple members.
- Create **diet plans** with macro targets and daily meal descriptions.
- View **member workout completion logs** and **diet logs**.
- Trainer is **strictly blocked** from: `/api/payments/*`, member registration, plan configuration.

---

## 2. Database Models Involved
| Model | Operations |
|---|---|
| `Trainer` | READ (own profile, assigned members) |
| `Member` | READ (assigned members list, profiles) |
| `BodyMeasurement` | CREATE, READ |
| `WorkoutPlan` | CREATE, UPDATE, READ |
| `WorkoutExercise` | CREATE, UPDATE, DELETE |
| `WorkoutAssignment` | CREATE, READ |
| `WorkoutProgress` | READ |
| `DietPlan` | CREATE, UPDATE, READ |
| `DietLog` | READ |

---

## 3. Backend API Endpoints

### 3.1 `GET /api/trainer/members` — Get Assigned Members
- **Requires:** `TRAINER`
- **Logic:** Find all `Member` records where `trainerId === req.user.trainerId`.
- **Response (200):**
  ```json
  {
    "assignedMembers": [
      {
        "id": "member-uuid-1",
        "memberId": "CF-2026-0001",
        "name": "Jane Miller",
        "avatarUrl": "https://...",
        "initialWeight": 68.0,
        "initialHeight": 165.0,
        "latestWeight": 65.5,
        "latestBmi": 24.06,
        "activePlan": "Platinum Half-Year",
        "lastMeasurementDate": "2026-06-01"
      }
    ]
  }
  ```

### 3.2 `POST /api/fitness/measurements` — Log Body Measurement
- **Requires:** `TRAINER`
- **Body:**
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
- **Auto BMI Calculation (Backend):**
  ```javascript
  const bmi = weight / Math.pow(height / 100, 2);
  const bmiRounded = Math.round(bmi * 100) / 100;
  ```
- **Validation Rules:**
  - Weight: 30–300 kg
  - Height: 100–250 cm
  - Reject: height = 0 to prevent division by zero
- **Success Response (201):**
  ```json
  {
    "success": true,
    "measurement": {
      "id": "log-uuid",
      "logDate": "2026-06-25T08:00:00.000Z",
      "bmi": 24.06,
      "weight": 65.5
    }
  }
  ```

### 3.3 `GET /api/fitness/progress/:memberId` — Get Measurement History
- **Requires:** `TRAINER`, `ADMIN`, or linked `MEMBER`
- **Query:** `?range=30d|3m|6m|all`
- **Response (200):**
  ```json
  {
    "history": [
      { "logDate": "2026-05-25", "weight": 80.0, "bmi": 24.69, "bodyFat": 15.2, "waist": 33.0 },
      { "logDate": "2026-06-25", "weight": 78.5, "bmi": 24.23, "bodyFat": 14.5, "waist": 32.0 }
    ]
  }
  ```

### 3.4 `POST /api/fitness/workouts` — Create & Assign Workout Plan
- **Requires:** `TRAINER`
- **Body:**
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
        "videoUrl": "https://youtube.com/watch?v=...",
        "notes": "Keep shoulders retracted"
      },
      {
        "exerciseName": "Lateral Raises",
        "sets": 3,
        "reps": 15,
        "targetWeight": 8.0
      }
    ]
  }
  ```
- **Logic:**
  1. Create `WorkoutPlan` with `trainerId`.
  2. Bulk-create all `WorkoutExercise` rows linked to plan.
  3. Create `WorkoutAssignment` linking plan to `memberId`.
- **Success Response (200):**
  ```json
  { "success": true, "assignmentId": "assignment-uuid-abc" }
  ```

### 3.5 `GET /api/fitness/workouts` — Get Member's Workout Plans
- **Requires:** `TRAINER`, `MEMBER`
- **Query:** `?memberId=uuid`
- **Response:** Active workout assignment with all exercises.

### 3.6 `POST /api/fitness/diets` — Create Diet Plan
- **Requires:** `TRAINER`
- **Body:**
  ```json
  {
    "memberId": "member-uuid-1",
    "title": "Clean Bulk Plan",
    "breakfast": "Oatmeal 80g + 4 egg whites + 1 scoop whey protein",
    "lunch": "150g chicken breast + 100g basmati rice + mixed greens",
    "snacks": "Handful of almonds + 1 green apple + protein shake",
    "dinner": "150g salmon + steamed broccoli + sweet potato",
    "targetCalories": 2800.0,
    "targetProtein": 180.0,
    "targetCarbs": 320.0,
    "targetFats": 80.0,
    "targetWaterMl": 4000.0
  }
  ```
- **Macro Validation (Client-side preview):**
  ```
  Estimated Calories = (protein × 4) + (carbs × 4) + (fats × 9)
  Show user if estimated ≈ targetCalories (±10%)
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "dietPlan": { "id": "diet-plan-uuid-999", "title": "Clean Bulk Plan" }
  }
  ```

### 3.7 RBAC Security Block
```javascript
// routes/payments.js — Trainer explicitly excluded
router.use('/api/payments', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']));

// routes/trainer.js
router.use(authenticateJWT, requireRole(['TRAINER', 'ADMIN', 'SUPER_ADMIN']));
```

---

## 4. Frontend Routes & Pages

### 4.1 `src/app/(dashboard)/trainer/page.tsx` — Trainer Dashboard
**Assigned Members Grid:**
- Glassmorphic grid of member cards, each showing:
  - Avatar, Member ID, Name.
  - Current weight vs. goal weight (progress bar).
  - Last measurement date.
  - Quick action icon buttons: 📏 Metrics, 💪 Workouts, 🥗 Diet.
- Search bar to filter by member name.
- Recent Activity Feed: Events when members complete workouts or log meals.

### 4.2 `src/app/(dashboard)/trainer/members/[id]/measurements/page.tsx` — Measurement Logger
**Form Section:**
- Grid of input fields:
  | Field | Unit | Validation |
  |---|---|---|
  | Weight | kg | 30–300 |
  | Height | cm | 100–250 |
  | Body Fat | % | 1–60 |
  | Chest | inches | optional |
  | Waist | inches | optional |
  | Hip | inches | optional |
  | Biceps | inches | optional |
  | Thigh | inches | optional |
  | Notes | text | optional |
- **Live BMI Preview:** As trainer types weight and height, show computed BMI instantly.
- Submit → POST to `/api/fitness/measurements`.

**History Section:**
- Small Recharts line chart of last 5 weight and BMI values.
- Table of all past measurements below.

### 4.3 `src/app/(dashboard)/trainer/members/[id]/workouts/page.tsx` — Workout Builder
**Builder Interface:**
- Draggable exercise row table.
- Each row: Exercise Name (searchable), Sets (number), Reps (number), Target Weight (kg), Demo URL (validated), Notes.
- **"+ Add Exercise"** button appends a new row.
- **"× Remove"** button on each row.
- **Assign Plan** button: Creates `WorkoutPlan` + `WorkoutExercise` rows + `WorkoutAssignment`.
- Show existing active plan below with option to deactivate.

### 4.4 `src/app/(dashboard)/trainer/members/[id]/diet/page.tsx` — Diet Planner
**Macro Setter Panel:**
- Number inputs for: Target Calories, Protein (g), Carbs (g), Fats (g), Water (ml).
- **Live Donut Chart:** Updates in real-time showing macro percentage distribution.
  - Protein = purple segment, Carbs = cyan segment, Fats = amber segment.
- **Calorie check indicator:** Shows green checkmark if `(protein×4 + carbs×4 + fats×9) ≈ targetCalories`.

**Meal Text Editors:**
- Four rich text areas: Breakfast, Lunch, Snacks, Dinner.
- Character count displayed per field.

---

## 5. Phase 5 Completion Checklist
- [ ] Implement `GET /api/trainer/members` filtering by trainer's own ID
- [ ] Implement `POST /api/fitness/measurements` with auto-BMI calculation and input validation (30–300 kg, 100–250 cm)
- [ ] Implement `GET /api/fitness/progress/:memberId` with date range query filters
- [ ] Implement `POST /api/fitness/workouts` with `WorkoutPlan`, bulk `WorkoutExercise`, and `WorkoutAssignment` in a single transaction
- [ ] Implement `GET /api/fitness/workouts?memberId=uuid`
- [ ] Implement `POST /api/fitness/diets`
- [ ] Verify RBAC: `TRAINER` token returns 403 on `GET /api/payments/ledger`
- [ ] Build Trainer Dashboard with assigned member grid and activity feed (`/trainer`)
- [ ] Build Measurement Logger form with live BMI preview (`/trainer/members/[id]/measurements`)
- [ ] Build mini Recharts history chart in measurements page
- [ ] Build Workout Builder with dynamic draggable exercise rows (`/trainer/members/[id]/workouts`)
- [ ] Build Diet Planner with live donut chart macro preview (`/trainer/members/[id]/diet`)
- [ ] Test: Submit measurements with height=0 → server returns 400 Bad Request
- [ ] Test: Trainer cannot create new member via `POST /api/admin/members`
- [ ] Test: All 4 meal fields and 5 macro fields save correctly to `DietPlan`
