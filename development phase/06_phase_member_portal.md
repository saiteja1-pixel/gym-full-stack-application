# Phase 6 — Member Portal

> **Goal:** Build the complete member-facing self-service portal — home dashboard (QR code widget, membership status, quick stats), personal progress analytics (Recharts transformation charts), active workout checklist (exercise check-off, video modals, completion feedback), daily diet tracker (meal schedule, hydration widget, macro progress rings), and payment invoice history with PDF download.
>
> **Depends on:** Phase 1 (Auth), Phase 4 (QR display), Phase 5 (Workout plans, Diet plans, Body measurements all exist)

**Source PRDs:**
- [02_customer_panel.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/02_customer_panel.md)
- [04_diet_management.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/04_diet_management.md)
- [05_workout_management.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/05_workout_management.md)
- [06_fitness_tracking.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/06_fitness_tracking.md)
- [design.md §5 (UI Components)](file:///c:/Users/HP/Downloads/full stack application/design.md)

---

## 1. Scope & Objectives
- Members access **only their own** data — no other member's data is accessible.
- Display personal **QR code** for check-in (freshly fetched, never cached in localStorage).
- Show **membership status**, plan name, days remaining countdown, and trainer name.
- View **progress analytics** — weight, BMI, body fat trends on interactive Recharts.
- Access **workout checklist** — mark exercises complete, watch tutorial videos, submit workout feedback.
- Track **daily diet** — view trainer meal schedule, log water intake, log calories/protein.
- View **macro progress rings** comparing logged vs. target values.
- View **payment history** and download **PDF invoices**.
- Receive in-app **notification alerts** for expiring membership, announcements.

---

## 2. Database Models Involved
| Model | Operations |
|---|---|
| `Member` | READ (own profile, QR token) |
| `Membership` | READ (plan details, status, expiry) |
| `BodyMeasurement` | READ (history for charts) |
| `WorkoutAssignment` | READ (active plan) |
| `WorkoutExercise` | READ |
| `WorkoutProgress` | CREATE (completion log) |
| `DietPlan` | READ (assigned diet) |
| `DietLog` | CREATE, READ |
| `Attendance` | READ (own check-in history) |
| `Payment` | READ (own invoice list) |
| `Notification` | READ (own alerts) |

---

## 3. Backend API Endpoints

### 3.1 `GET /api/auth/me` — Get Member Profile with Membership
Already implemented in Phase 1 — returns full profile with `qrCodeToken`, `membership`, `trainer`.

### 3.2 `GET /api/fitness/progress/:memberId` — Get Measurement History
Already implemented in Phase 5.

### 3.3 `GET /api/fitness/workouts?memberId=uuid` — Get Active Workout
Already implemented in Phase 5.

### 3.4 `POST /api/fitness/workouts/progress` — Submit Workout Completion
- **Requires:** `MEMBER`
- **Body:**
  ```json
  {
    "memberId": "member-uuid-abc",
    "assignmentId": "assignment-uuid-111",
    "completed": true,
    "feedback": "Squats felt strong. All reps completed with good form."
  }
  ```
- **Response (200):**
  ```json
  { "success": true, "logId": "progress-log-uuid" }
  ```

### 3.5 `POST /api/fitness/diet-logs` — Log Food/Water Intake
- **Requires:** `MEMBER`
- **Body:**
  ```json
  {
    "memberId": "member-uuid-abc",
    "dietPlanId": "diet-plan-uuid-999",
    "waterIntakeMl": 500.0,
    "caloriesLog": 650.0,
    "proteinLog": 42.0
  }
  ```
- **Validation:** Reject negative values on both client and server.
- **Response (200):**
  ```json
  { "success": true, "totalWaterLoggedToday": 1500.0 }
  ```

### 3.6 `GET /api/fitness/diet-logs/today` — Today's Nutritional Summary
- **Requires:** `MEMBER`
- **Query:** `?memberId=uuid&date=2026-06-25`
- **Logic:** Aggregate all `DietLog` rows for the member on the given date.
- **Response (200):**
  ```json
  {
    "target": { "calories": 2800.0, "protein": 180.0, "water": 4000.0 },
    "consumed": { "calories": 1850.0, "protein": 115.0, "water": 2500.0 }
  }
  ```

---

## 4. Frontend Routes & Pages

### 4.1 `src/app/(dashboard)/member/page.tsx` — Member Home

**QR Check-In Widget (Top Center):**
- Glassmorphic card rendering the member's `qrCodeToken` as a QR image via `qrcode.react`.
- Member ID and Name displayed below QR.
- Refresh button to re-fetch token from server.
- **NEVER** store token in `localStorage` or `sessionStorage`.

**Membership Status Card:**
- Plan name (e.g., "Gold Annual Package").
- Status badge: ACTIVE (emerald), EXPIRED (rose pulsing), FROZEN (amber).
- Days remaining: computed as `Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))`.
- Trainer name.
- Alert if expiring in ≤ 7 days: Amber banner — "Your membership expires in X days. Renew now."

**Quick Stats Row (3 circular gauges):**
- Workout Completion %: exercises completed today / total exercises.
- Calorie Goal %: `caloriesConsumed / targetCalories * 100`.
- Water Intake %: `waterLogged / targetWater * 100`.

### 4.2 `src/app/(dashboard)/member/progress/page.tsx` — Progress Analytics

**Time Range Filter Tabs:** 30 Days | 3 Months | 6 Months | All Time

**Weight & BMI Dual-Axis Line Chart:**
```tsx
<ComposedChart data={history}>
  <defs>
    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="hsl(263.4, 90%, 50.4%)" stopOpacity={0.4}/>
      <stop offset="95%" stopColor="hsl(263.4, 90%, 50.4%)" stopOpacity={0}/>
    </linearGradient>
    <linearGradient id="bmiGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="hsl(191.6, 91.4%, 36.5%)" stopOpacity={0.4}/>
      <stop offset="95%" stopColor="hsl(191.6, 91.4%, 36.5%)" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fill="url(#weightGrad)" />
  <Line type="monotone" dataKey="bmi" yAxisId="right" stroke="hsl(var(--secondary))" />
</ComposedChart>
```

**Body Fat % Chart:** Single line chart with neon rose gradient fill.

**Circumference Body Map:** Visual layout showing Chest, Waist, Hip, Biceps, Thigh measurements.

**Measurements History Table:** Date, Weight, BMI, Body Fat, Waist — with color-coded delta (improvement in green, regression in red).

**Null Safety:** If a metric (e.g., body fat) is missing, the chart skips that point instead of rendering zero.

### 4.3 `src/app/(dashboard)/member/workouts/page.tsx` — Workout Tracker

**Active Workout Header:** Plan title, description, trainer name.

**Checklist Engine:**
- Each exercise displayed as a glassmorphic row card:
  - Exercise Name, Sets × Reps, Target Weight.
  - ✅ Checkbox to mark complete — triggers a spring animation on check.
  - 📹 "Watch Form" button → opens a fullscreen video overlay modal.
- Progress bar at top: "3 of 6 exercises completed".

**Framer Motion Checklist Animation:**
```typescript
export const listItemTransition = {
  layout: { type: 'spring', stiffness: 600, damping: 30 }
};
```

**Completion Flow:**
- "Submit Workout" button enabled only after ALL exercises are checked.
- Clicking opens a feedback modal with a textarea.
- On submit → `POST /api/fitness/workouts/progress`.

**Rest Day State:** If no workout assigned today, show:
```
[ 🌙 Rest Day. Relax and recover! ]
```

**Persistence:** Checked state is stored in `localStorage[date]` key → clears when date changes.

### 4.4 `src/app/(dashboard)/member/diet/page.tsx` — Diet & Nutrition Tracker

**Meal Schedule (from trainer's DietPlan):**
- 4 sections (Breakfast, Lunch, Snacks, Dinner) in glassmorphic accordion cards.
- Each section shows the trainer-written meal text.
- Input fields per section: Calories consumed (number), Protein consumed (g) — member can log after eating.

**Water Hydration Widget:**
- SVG animated water bottle / cup visualization.
- Fluid level height = `(waterLogged / targetWater) * 100%` (capped at 150%).
- Quick log buttons: `+250ml`, `+500ml`, `+1000ml` — each triggers `POST /api/fitness/diet-logs`.
- Button Framer Motion animation:
  ```typescript
  export const tapScaling = {
    whileHover: { scale: 1.05, boxShadow: '0 0 15px rgba(34,211,238,0.4)' },
    whileTap: { scale: 0.95 }
  };
  ```

**Macro Progress Rings:**
- Three circular SVG rings:
  - 🟣 Calories: `consumed / target * 100%` — purple ring.
  - 🔵 Protein: consumed / target — cyan ring.
  - 💧 Water: logged / target — blue ring.
- Default targets if no plan assigned: 2000 kcal, 100g protein, 3000ml water.

**Daily Reset:** DietLogs aggregate based on the member's local date. A new day resets all logged values to 0.

---

## 5. Animations & Visual Specifications

### Glassmorphic Chart Tooltip:
```tsx
const CustomGlassTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-panel p-3 border border-white/10 rounded-lg shadow-2xl backdrop-blur-md">
        <p className="text-white/60 text-xs mb-1 font-semibold">
          {new Date(label).toLocaleDateString()}
        </p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value} {entry.name === 'Weight' ? 'kg' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
```

---

## 6. Phase 6 Completion Checklist
- [ ] Implement `POST /api/fitness/workouts/progress` — workout completion log
- [ ] Implement `POST /api/fitness/diet-logs` with negative value validation
- [ ] Implement `GET /api/fitness/diet-logs/today` with daily aggregation
- [ ] Build Member Home page with QR widget, membership card, and quick stats gauges (`/member`)
- [ ] Build days-remaining countdown timer on membership card
- [ ] Build expiry warning banner (≤7 days alert) and expired/frozen status banners
- [ ] Build Personal Progress page with dual-axis weight/BMI chart and body fat chart (`/member/progress`)
- [ ] Build time range filter tabs (30d, 3m, 6m, all)
- [ ] Build glassmorphic custom tooltip component for all charts
- [ ] Build body measurements history table with delta color coding
- [ ] Build Workout Tracker checklist page with exercise rows (`/member/workouts`)
- [ ] Implement Framer Motion spring animation on exercise check-off
- [ ] Build video tutorial overlay modal
- [ ] Implement local storage persistence for checked exercises (day-scoped key)
- [ ] Build workout feedback submission modal
- [ ] Build Diet Tracker page with meal sections, water widget, and macro rings (`/member/diet`)
- [ ] Build SVG animated fluid hydration widget
- [ ] Implement water quick-log buttons with Framer Motion tap animations
- [ ] Test: Member cannot access another member's profile or data
- [ ] Test: BMI calculation renders correctly using height in cm (divide by 100 before squaring)
- [ ] Test: Logging negative calories returns 400 from API
- [ ] Test: Checked exercises remain after page refresh; reset after midnight
