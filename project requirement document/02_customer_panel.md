# Project Requirements Document - Customer Panel (Member Portal)

## 1. Module Overview & Objectives
The Customer Panel (Member Portal) is the primary interactive hub for gym members. It provides a personal fitness dashboard to access membership details, track daily attendance, view personalized workout routines, log diet inputs, monitor physical transformations, and download payment invoices.

The key objectives are to:
- Empower members to self-manage and review their active plans.
- Provide a quick, digital QR-based entry interface for contactless gym check-in.
- Keep members engaged by visualizing physical measurements and BMI trends.
- Simplify workout execution with interactive checklists and exercise demonstrations.
- Promote dietary accountability with daily calorie, protein, and water trackers.

---

## 2. User Roles & Permissions
- **Member**: Has access only to their own profile, personal logs (weight, workouts, diets, attendance), and payment invoices. Members *cannot* access billing engines, member directories, other members' profiles, or trainer dashboards.
- **Admin/Trainer**: Can view a member's progress data but cannot log personal details (like water intake) on behalf of the member.

---

## 3. Database Schema Mapping
The Customer Panel fetches and logs records from the following Prisma models:
- **Member**: Stores profile photo, contact details, initial measurements, and active trainer links.
- **Membership & MembershipPlan**: Exposes active plan parameters (start/end dates, freeze balance).
- **Attendance**: Logs historical scan logs showing check-in timestamp details.
- **BodyMeasurement**: Logs weight, body fat, BMI, and physical measurements.
- **WorkoutProgress & WorkoutAssignment**: Tracks active exercises and completion checks.
- **DietLog & DietPlan**: Tracks macro intakes, water volume log counts, and targeted daily caps.
- **Notification**: Alerts users about expirations, announcements, and messages.

---

## 4. Frontend Route Structure
Members access their dedicated dashboards inside the Next.js App Router under `/member`:
- `[member/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/member/page.tsx)`: Portal landing page. Renders check-in QR code, active membership status, and quick progress metrics.
- `[member/progress/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/member/progress/page.tsx)`: Interactive graphs rendering weight, BMI, body fat %, and circumference tracking.
- `[member/workouts/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/member/workouts/page.tsx)`: Checklist dashboard for the current day's routine, with exercise forms, sets/reps target tables, and workout feedback logs.
- `[member/diet/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/member/diet/page.tsx)`: Dynamic macro log sheet featuring water loggers and meal guidelines.
- `[member/invoices/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/member/invoices/page.tsx)`: List of transactions, with PDF receipts download triggers.

---

## 5. Detailed Functional Specifications

### 5.1 Member Dashboard Home
- **Check-In Widget**: Features a glassmorphic card displaying the member's unique cryptographic QR code. 
- **Plan Summary Card**: Highlights active plan names (e.g., "Premium Gold Annual"), days remaining (calculated via client-side countdown), and trainer name. If expired, displays a flashing rose red alert overlay.
- **Quick Track Counters**: Circular gauges displaying daily completion percentages for workouts, calorie goals, and water target goals (e.g., "1500ml / 3000ml logged").

### 5.2 Contactless QR Check-In
- Upon loading the portal, the client requests the active cryptographically secure token from the session.
- The token is rendered as a clean, high-contrast QR Code using standard client libraries.
- The member presents the screen at the reception camera. Attendance registers, updating the check-in status feed instantly.

### 5.3 Personal Progress Dashboard
- Displays weight logs on a dynamic line chart (purple neon accent line with underlying glow gradient).
- Renders BMI variations over time. BMI is calculated as:
  $$\text{BMI} = \frac{\text{Weight (kg)}}{\left(\frac{\text{Height (cm)}}{100}\right)^2}$$
- Displays a visual layout of measurements (waist, hips, chest, biceps) on a body map.

### 5.4 Active Workout Tracker
- Renders active trainer-assigned routines.
- Displays exercises in a linear list. Each exercise item shows:
  - Exercise Name & Description.
  - Target Sets, Reps, and Target Weights.
  - "Watch Form" video demo link button.
- Members can check off exercises as completed. Upon clicking, a database update is triggered.
- A final "Complete Workout" button submits subjective feedback (e.g., "Felt heavy in sets 3-4").

### 5.5 Diet & Macro Intake Logger
- **Meal Schedule**: Lists trainer-specified menus for Breakfast, Lunch, Dinner, and Snacks.
- **Intake Log Form**: Interactive buttons allowing members to log water (presets: `+250ml`, `+500ml`, `+1L`) and add calories/protein logs (linked to a meal database or manual entries).
- **Macro Progress Bar**: Renders active daily consumed totals against target calorie/protein thresholds.

---

## 6. API Specifications

### 6.1 Get Logged-In Profile (`GET /api/auth/me`)
- **Headers**: `Authorization: Bearer <Token>` (Role: `MEMBER`)
- **Success Response (200)**:
  ```json
  {
    "id": "user-uuid-111",
    "email": "member@email.com",
    "role": "MEMBER",
    "profile": {
      "id": "member-uuid-222",
      "memberId": "CF-2026-0001",
      "name": "Alex Carter",
      "qrCodeToken": "secure-cryptographic-hash-value-here",
      "initialHeight": 180.0,
      "initialWeight": 78.5,
      "membership": {
        "id": "membership-uuid-333",
        "startDate": "2026-01-01T00:00:00.000Z",
        "endDate": "2026-12-31T00:00:00.000Z",
        "status": "ACTIVE",
        "plan": {
          "name": "Gold Annual Package"
        }
      },
      "trainer": {
        "name": "Coach Marcus"
      }
    }
  }
  ```

### 6.2 Get Historical Progress (`GET /api/fitness/progress/:memberId`)
- **Success Response (200)**:
  ```json
  {
    "measurements": [
      {
        "id": "log-1",
        "logDate": "2026-05-01T08:00:00.000Z",
        "weight": 78.5,
        "height": 180.0,
        "bmi": 24.23,
        "bodyFat": 14.5
      },
      {
        "id": "log-2",
        "logDate": "2026-06-01T08:00:00.000Z",
        "weight": 77.0,
        "height": 180.0,
        "bmi": 23.77,
        "bodyFat": 13.8
      }
    ]
  }
  ```

### 6.3 Log Water Intake (`POST /api/fitness/diet-logs`)
- **Request Body**:
  ```json
  {
    "memberId": "member-uuid-222",
    "dietPlanId": "diet-plan-uuid-999",
    "waterIntakeMl": 500.0,
    "caloriesLog": 0.0,
    "proteinLog": 0.0
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "totalWaterLoggedToday": 1500.0
  }
  ```

---

## 7. UI Framer Motion Animations & CSS Visuals
To maintain the high-fidelity glassmorphic visual standard:
- Apply dynamic scaling on interactive counter buttons (water log presets):
  ```typescript
  export const tapScaling = {
    whileHover: { scale: 1.05, boxShadow: "0 0 15px rgba(34, 211, 238, 0.4)" },
    whileTap: { scale: 0.95 }
  };
  ```
- Tooltips inside charts must render with translucent dark card backdrops and neon cyan borders:
  ```html
  <div className="backdrop-blur-md bg-zinc-950/70 border border-cyan-500/20 rounded-xl p-3 shadow-xl">
    ...
  </div>
  ```

---

## 8. Verification & QA Checklist
1. **QR Token Masking**: Confirm that the QR display token is never stored in public client caches or local storage files, and is fetched fresh upon component mount.
2. **BMI Calculations validation**: Confirm the formula handles heights in cm correctly, dividing by 100 before squaring.
3. **Data Integrity Check**: Test that when log limits are exceeded (e.g. logging negative calorie numbers), validation intercepts prevent DB corruption.
4. **Responsive Check**: Confirm that charts and water tracker widgets scale down gracefully to fit mobile portrait screens (under 375px wide).
