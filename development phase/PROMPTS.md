# Agent Development Prompts — Gym Membership Management System

> This file contains the **exact prompts** you should give to your AI coding agent to develop each phase of the Gym Membership Management System. Copy each prompt block exactly and paste it into the agent chat.
>
> **Before You Start:**
> - Share these files with the agent at the start of each phase:
>   - `@design.md` — Full technical design specification
>   - The relevant phase file (e.g., `@01_phase_foundation_and_infrastructure.md`)
> - Always wait for the agent to finish Phase N completely before starting Phase N+1.
> - The agent MUST report any missing information or required environment variable updates at the end of every phase.

---

## 🔴 Global Agent Rules (Include in EVERY prompt)

These rules apply across all phases. They are already embedded in each prompt below but are listed here for reference:

1. **At the end of every phase**, the agent must provide a "Phase Completion Report" that includes:
   - ✅ What was built
   - 🔑 All new environment variables added (key name + description + where to set it)
   - ⚠️ Any missing information it needs from you to proceed
   - 📋 Manual steps you need to do (e.g., create Supabase bucket, add Firebase config)
   - 🧪 How to verify the phase is working
2. **Never skip** a phase. Each phase depends on the previous.
3. **Always use** the exact tech stack: Next.js 15, Express.js, Prisma ORM, Supabase PostgreSQL, JWT, Tailwind CSS, shadcn/ui, Framer Motion, Recharts.
4. **Follow the design.md** visual specification: Glassmorphic dark theme, neon purple/cyan accents, Outfit/Inter fonts.
5. **Never hardcode** secrets. All sensitive values go in `.env` / `.env.local`.
6. **Write production-quality code** — not scaffold/placeholder code. Every form, API, and component must be fully functional.

---

---

## 📦 Phase 1 Prompt — Foundation & Infrastructure

```
@design.md @01_phase_foundation_and_infrastructure.md

You are building Phase 1 of the Gym Membership Management System called "Core Fit Club".

TASK: Set up the complete project foundation as described in the Phase 1 specification document above.

=== WHAT TO BUILD ===

BACKEND (Express.js):
1. Initialize a Node.js + Express.js backend project in a folder called `backend/`.
2. Install dependencies: express, cors, helmet, dotenv, prisma, @prisma/client, jsonwebtoken, bcrypt.
3. Create the complete `prisma/schema.prisma` file with ALL models and enums as specified in design.md Section 3. This includes: User, Admin, Trainer, Member, MembershipPlan, Membership, Payment, Attendance, BodyMeasurement, WorkoutPlan, WorkoutExercise, WorkoutAssignment, WorkoutProgress, DietPlan, DietLog, Notification — and all 6 enums.
4. Run: `npx prisma migrate dev --name init_full_schema`
5. Implement `middleware/auth.js` with `authenticateJWT` and `requireRole` functions.
6. Implement `POST /api/auth/login` — validates email/password, returns JWT.
7. Implement `GET /api/auth/me` — decodes token and returns full user profile with nested sub-profile.

FRONTEND (Next.js 15):
1. Initialize a Next.js 15 project with TypeScript, Tailwind CSS, and shadcn/ui in a folder called `frontend/`.
2. Install: framer-motion, recharts, lucide-react, @tanstack/react-query.
3. Create `src/app/globals.css` with the COMPLETE Glassmorphic design token system from design.md Section 1.1 and 1.2 — ALL CSS custom properties (--primary, --secondary, --glass-background, --glass-border, --glass-blur, all neon accent colors) and ALL utility classes (.glass-panel, .glass-panel-hover, .glass-input, custom scrollbar).
4. Import 'Outfit' and 'Inter' fonts from Google Fonts.
5. Create `src/lib/animations.ts` with the Framer Motion presets: pageTransition, listContainer, listItem, interactiveHover.
6. Create the Landing page (`src/app/page.tsx`) — A premium glassmorphic dark design with 3 portal selector cards (Admin, Trainer, Member) each with role description, icon, and a "Enter Portal" button linking to `/login?role=ROLE`.
7. Create the Login page (`src/app/login/page.tsx`) — Glassmorphic login card centered on dark background. Fields: Email, Password. Show role from query param. On success, store JWT and role in context, redirect to correct dashboard.
8. Create `src/components/DashboardShell.tsx` — Role-based dynamic sidebar (ADMIN, TRAINER, MEMBER navigation items as defined in design.md Section 5.1). Include glassmorphic sidebar styling, CoreFit logo, active route highlighting, and Logout button.
9. Create `src/app/(dashboard)/layout.tsx` — wraps children with DashboardShell.
10. Create placeholder pages for: `/admin`, `/trainer`, `/member` (each just shows "Dashboard - Coming Soon" for now).
11. Create `src/context/AuthContext.tsx` — stores user, token, role. Provides login/logout functions.

SUPABASE STORAGE:
- Instruct me to manually create two storage buckets in Supabase Dashboard: `avatars` (public) and `id-proofs` (private with RLS).

=== DEPENDENCY NOTES ===
This is Phase 1 — the base foundation. No previous phase dependencies.
All subsequent phases (2–7) depend on this phase being fully complete.

=== RULES ===
- Follow the Glassmorphic dark design system from design.md EXACTLY.
- All secrets go in .env (backend) and .env.local (frontend). Never hardcode.
- Code must be fully functional — no placeholder logic in auth.

=== PHASE COMPLETION REPORT (REQUIRED) ===
At the end, provide:
1. ✅ List of every file created with its path.
2. 🔑 ALL environment variables needed — for BOTH backend `.env` and frontend `.env.local` — with key name, what value to put, and where to get it.
3. ⚠️ Any information you need from me that is missing (e.g., Supabase project URL, JWT secret preference).
4. 📋 Manual steps I must complete (e.g., create Supabase buckets, run migrations).
5. 🧪 How to test Phase 1 is working correctly (API calls + UI checks).
```

---

---

## 📦 Phase 2 Prompt — Admin Module

```
@design.md @02_phase_admin_module.md

You are building Phase 2 of the Gym Membership Management System.

=== PHASE DEPENDENCY ===
Phase 1 is COMPLETE. The following are already built and working:
- Backend: Express server, Prisma schema (all models migrated), JWT auth middleware (authenticateJWT, requireRole), POST /api/auth/login, GET /api/auth/me.
- Frontend: Next.js 15 app with DashboardShell, AuthContext, globals.css design tokens, Framer Motion presets, Landing page, Login page.
- Supabase: Database connected, Storage buckets (avatars, id-proofs) exist.
Do NOT rebuild or re-initialize anything from Phase 1. Build on top of it.

=== WHAT TO BUILD ===

BACKEND (Express.js):
1. Membership Plan APIs (all require ADMIN or SUPER_ADMIN):
   - POST /api/admin/membership-plans — Create plan (name, price, duration, durationDays, joiningFee, gstPercent, freezeDays, description).
   - GET /api/admin/membership-plans — List all active plans.
   - PUT /api/admin/membership-plans/:id — Update plan.
   - DELETE /api/admin/membership-plans/:id — Soft-delete (set isActive=false).

2. Member Management APIs:
   - POST /api/admin/members — Register member. MUST use a Prisma transaction that: checks email uniqueness, hashes default password (CoreFit2026!), auto-generates sequential memberId (CF-YYYY-XXXX), generates cryptographic HMAC-SHA256 qrCodeToken using QR_SECRET_SALT env variable, calculates membership startDate/endDate from plan's durationDays, creates User + Member + Membership atomically.
   - GET /api/admin/members — Paginated list with search (name/phone/email) and status (ACTIVE/EXPIRED/FROZEN/CANCELLED) filters.
   - GET /api/admin/members/:id — Full member detail with membership, trainer, latestMeasurement nested.
   - PUT /api/admin/members/:id — Update profile fields.
   - PUT /api/admin/members/:id/freeze — Freeze membership (body: {freezeDays}). Update status=FROZEN, record freezeStart, extend endDate.
   - PUT /api/admin/members/:id/renew — Renew membership (body: {planId}). Create new Membership record.

3. Document upload helper:
   - POST /api/upload/avatar — Upload profile photo to Supabase `avatars` bucket.
   - POST /api/upload/id-proof — Upload ID proof to Supabase `id-proofs` bucket.

FRONTEND (Next.js 15):
1. /admin/memberships/page.tsx — Glassmorphic plan cards grid. Create Plan side-drawer form. Edit/Deactivate inline actions.
2. /admin/members/page.tsx — Member directory: search bar, status filter tabs (All/Active/Expired/Frozen), data table with columns (Member ID, Name, Phone, Plan, Expiry, Status badge). Status badge colors: ACTIVE=emerald, EXPIRED=rose, FROZEN=amber.
3. /admin/members/new/page.tsx — 3-step registration form:
   - Step 1: Personal Info (Name, Email, Phone, DOB, Gender, Emergency Contact).
   - Step 2: Physical Baseline (Height cm, Weight kg), Trainer assignment (searchable dropdown), Plan selection (card grid).
   - Step 3: Documents (webcam capture OR file upload for avatar; PDF/image for ID proof). Preview before submitting.
   - On submit: Upload files to Supabase → get URLs → POST /api/admin/members.
   - On success: Show modal with generated QR code (use qrcode.react), member ID, and Download QR button.
4. /admin/members/[id]/page.tsx — Member profile page: header (avatar, name, status badge, edit button), info cards (contact, plan details with days-remaining countdown, trainer assigned), membership action buttons (Freeze, Renew, Upgrade, Downgrade — each opens confirmation modal).

Install: qrcode.react (frontend), @supabase/supabase-js (both)

=== DESIGN RULES ===
- All UI must use the glassmorphic dark design system from globals.css.
- Forms use glass-input styling. Drawers use glass-panel with backdrop-blur.
- Animate page transitions using the pageTransition Framer Motion preset.
- Member cards in the directory should use listContainer/listItem stagger animation.
- Status badges must be colored correctly (ACTIVE=emerald, EXPIRED=rose, FROZEN=amber) with a subtle glow.

=== PHASE COMPLETION REPORT (REQUIRED) ===
At the end, provide:
1. ✅ List of every new file created and every existing file modified.
2. 🔑 Any NEW environment variables added this phase (key name, description, where to get the value).
3. ⚠️ Any information you need from me that is missing (e.g., Supabase bucket names, default password preference).
4. 📋 Manual steps I must complete (e.g., set Supabase Storage bucket policies, run any new migrations).
5. 🧪 Exact steps to test Phase 2: What API calls to make, what UI flows to test, what to verify in the database.
```

---

---

## 📦 Phase 3 Prompt — Payments & Invoicing

```
@design.md @03_phase_payments_and_invoicing.md

You are building Phase 3 of the Gym Membership Management System.

=== PHASE DEPENDENCY ===
Phases 1 and 2 are COMPLETE. The following already exist and work:
- All auth middleware, JWT, RBAC.
- All member management APIs and pages.
- All membership plan APIs and pages.
- Supabase storage uploads working.
- Members are registered in the database with plans assigned.
Do NOT rebuild anything from Phase 1 or Phase 2.

=== WHAT TO BUILD ===

BACKEND (Express.js):
1. POST /api/payments/invoice (ADMIN, SUPER_ADMIN only):
   - Body: {memberId, planId, amountPaid, totalAmount, taxAmount, method, notes}
   - Generate sequential invoiceNumber: query Payment table for latest INV-YYYY-XXXX → increment.
   - Create Payment record.
   - Update linked Membership.status = ACTIVE if status=PAID.
   - Return full invoice object.

2. GET /api/payments/ledger (ADMIN, SUPER_ADMIN only):
   - Query: ?startDate, ?endDate, ?status, ?method, ?page, ?limit
   - Return: transactions array + summary {totalRevenue, totalPending, totalTransactions} + monthlyRevenue array [{month, revenue}] for Recharts.

3. GET /api/payments/member/:memberId:
   - Accessible by linked MEMBER or ADMIN/SUPER_ADMIN.
   - Return all payment records for that member.

FRONTEND (Next.js 15):
1. /admin/page.tsx — Full Admin Analytics Dashboard:
   - Row of 7 stat cards (Total Members, Active Members, Expired Members, Upcoming Renewals in 7 days, Today's Check-Ins, Monthly Revenue, Pending Payments). Use AnalyticsCard component from design.md Section 5.2. Each card has correct glow color (purple, emerald, rose, amber, cyan).
   - Revenue Trend Line Chart (Recharts) with neon purple gradient area fill and glassmorphic custom tooltip. X=months, Y=revenue in ₹.
   - Membership Distribution Donut Chart (Active vs Expired vs Frozen) with neon purple/rose/amber segments.
   - Recent Activity Feed — last 10 events (registrations, renewals, check-ins) with icon + description + time ago.

2. /admin/payments/page.tsx — Payment Ledger:
   - Summary bar: Total Revenue, Pending Amount, Total Invoices (3 cards).
   - Filter bar: date range picker, Status dropdown, Method dropdown.
   - Transactions table: Invoice #, Member Name, Amount, Tax, Method, Status badge, Date, actions (View, Download PDF).
   - "Record Payment" button → modal form: Select Member, Select Plan, Amount Paid, Method, Notes. Show live GST breakdown: base price → + GST 18% → = Total.
   - GST calculation: taxAmount = basePrice × (gstPercent/100), totalAmount = basePrice + taxAmount.

3. /admin/reports/page.tsx — Reports Export:
   - 4 tabs: Revenue, Attendance, Members, Weight Progress.
   - Date range picker. Format selector (CSV / Excel / PDF).
   - Generate & Download button (connect to API endpoints from Phase 7 — for now, placeholder that shows "Report generation coming in Phase 7").
   - Preview table showing first 10 rows of data.

4. /member/invoices/page.tsx — Member Invoice History:
   - List of payment records: Invoice #, Date, Plan Name, Amount, Status badge.
   - Download PDF button per invoice — triggers exportInvoicePdf() client-side.

5. Create `src/lib/exportInvoicePdf.ts` — Full jsPDF + jspdf-autotable implementation:
   - Dark header block (RGB 9,9,11)
   - Cyan neon gym name text
   - White invoice metadata
   - Member billing details
   - AutoTable with purple header row
   - GST breakdown section
   - Save as INV-YYYY-XXXX.pdf

Install: jspdf, jspdf-autotable (frontend)

=== DESIGN RULES ===
- Revenue chart must use the exact Recharts gradient spec from design.md Section 1.4 (linearGradient revenueGrad).
- Custom tooltip must use the CustomGlassTooltip pattern from design.md Section 1.4.
- All stat cards must use the AnalyticsCard component pattern from design.md Section 5.2.
- The dashboard must feel like a premium analytics terminal — not a basic table.

=== PHASE COMPLETION REPORT (REQUIRED) ===
At the end, provide:
1. ✅ List of every new file created and every existing file modified.
2. 🔑 Any NEW environment variables needed this phase.
3. ⚠️ Any information you need from me that is missing (e.g., currency preference, GST rate overrides).
4. 📋 Manual steps I must complete.
5. 🧪 Exact steps to test: Record a payment via UI → verify INV number generated → download PDF → verify PDF contents.
```

---

---

## 📦 Phase 4 Prompt — Attendance & QR System

```
@design.md @04_phase_attendance_and_qr_system.md

You are building Phase 4 of the Gym Membership Management System.

=== PHASE DEPENDENCY ===
Phases 1, 2, and 3 are COMPLETE. The following already exist:
- Members are in the database, each with a unique qrCodeToken (generated in Phase 2 registration).
- Auth middleware, JWT, RBAC all working.
- The Member home page (/member) already exists as a placeholder from Phase 1.
Do NOT rebuild anything from Phases 1–3.

=== WHAT TO BUILD ===

BACKEND (Express.js):
1. Create `utils/generateQrToken.js` — HMAC-SHA256 token generator using QR_SECRET_SALT from .env. (This utility was already called in Phase 2 — confirm it exists. If not, create it now.)

2. POST /api/attendance/scan (ADMIN, SUPER_ADMIN only):
   - Body: {qrCodeToken}
   - Perform ALL 5 validation checks in sequence:
     * Check 1: Token matches a Member in DB. If not → status=INVALID_TOKEN, 404.
     * Check 2: Membership.endDate >= today. If not → status=EXPIRED_PLAN, 400.
     * Check 3: Membership.status === ACTIVE. If FROZEN → status=FROZEN. If CANCELLED → status=CANCELLED.
     * Check 4: Latest Payment for member is PAID or PARTIAL. If not → status=UNPAID.
     * Check 5: No VALID Attendance record for this member in the last 60 minutes. If found → status=DUPLICATE.
   - On PASS: Create Attendance {memberId, status:'VALID'}. Return 200 with member name, avatar, plan name, expiry.
   - On FAIL: Create Attendance {memberId, status: failureCode}. Return 400 with reason and denialCode.

3. GET /api/attendance/logs (ADMIN, SUPER_ADMIN, TRAINER):
   - Query: ?memberId, ?startDate, ?endDate, ?status, ?page, ?limit
   - Return paginated flat array of attendance records with member name.

FRONTEND (Next.js 15):
1. /admin/scan/page.tsx — QR Scanner page:
   - Install html5-qrcode: `npm install html5-qrcode`
   - Camera viewport centered on dark page with a QR target box overlay (250×250px).
   - useEffect initializes Html5QrcodeScanner on component mount. On scan: POST to /api/attendance/scan with JWT.
   - On VALID response: Show fullscreen emerald green overlay (animated scale-in) with member avatar, name, plan name, expiry date, and a green checkmark icon. Auto-dismiss after 4 seconds.
   - On DENIED response: Show rose red pulsing overlay (3 pulse animations) with XCircle icon, "Access Denied" text, and denial reason (e.g., "Membership Expired"). Auto-dismiss after 4 seconds.
   - If camera permission denied: Show a user-friendly troubleshooting card explaining how to allow camera access in browser settings.
   - If navigator.onLine === false: Show amber banner "No internet connection. Scans cannot be validated."
   - Sidebar: Live Scan Log showing last 10 scans (member name, status icon, time).
   - Clean up scanner on component unmount.

2. /member/page.tsx — Member Home (upgrade from placeholder):
   - Top center: Glassmorphic QR code card. Fetch qrCodeToken fresh from GET /api/auth/me on every mount. Render using qrcode.react. Show member ID and name. "Refresh QR" button.
   - NEVER store qrCodeToken in localStorage or sessionStorage.
   - Membership Status Card: plan name, STATUS badge, days remaining (countdown: Math.ceil((endDate - now) / 86400000)), trainer name.
   - If status=EXPIRED: Flashing rose alert banner "Your membership has expired. Contact reception to renew."
   - If status=FROZEN: Amber banner "Membership frozen. Resumes on [freezeEnd date]."
   - If expiring within 7 days: Amber warning "Your membership expires in X days."
   - Quick Stats Row: 3 circular gauge components for Workout Completion %, Calorie Goal %, Water Intake %.

=== DESIGN RULES ===
- The scan overlays must be dramatic and full-screen — this is the reception desk experience. Emerald for valid, rose (pulsing) for denied.
- The QR code on the member portal must look premium and secure-feeling — surrounded by a glassmorphic card with subtle neon border.
- Scanner page background should be the same dark obsidian theme with the radial gradient accents.

=== PHASE COMPLETION REPORT (REQUIRED) ===
At the end, provide:
1. ✅ List of every new file created and every existing file modified.
2. 🔑 Any NEW environment variables added (especially confirm QR_SECRET_SALT is set in backend .env).
3. ⚠️ Any information you need from me (e.g., how long overlays should display, whether to add audio beep on scan).
4. 📋 Manual steps I must complete (e.g., enable camera permissions in any deployment config).
5. 🧪 Test steps: Scan a valid member QR → see green overlay → check DB Attendance table. Scan same member within 60 min → see rose DUPLICATE overlay.
```

---

---

## 📦 Phase 5 Prompt — Trainer Portal

```
@design.md @05_phase_trainer_portal.md

You are building Phase 5 of the Gym Membership Management System.

=== PHASE DEPENDENCY ===
Phases 1–4 are COMPLETE. The following already exist:
- Members are in the database and assigned to trainers (trainerId on Member model).
- Auth middleware, JWT, RBAC all working.
- Trainer has a profile in the Trainer model.
- WorkoutPlan, WorkoutExercise, WorkoutAssignment, WorkoutProgress, DietPlan, DietLog, BodyMeasurement models all exist in the schema (migrated in Phase 1) but NO data or APIs exist for them yet.
Do NOT rebuild anything from Phases 1–4.

=== CRITICAL SECURITY RULE ===
Trainers MUST be completely blocked from all payment endpoints. Verify that routes/payments.js uses requireRole(['ADMIN', 'SUPER_ADMIN']) and trainer tokens get a 403 if they try to hit any /api/payments/* route.

=== WHAT TO BUILD ===

BACKEND (Express.js):
1. GET /api/trainer/members (TRAINER only):
   - Return all Member records where trainerId === the logged-in trainer's profile ID.
   - Include: id, memberId, name, avatarUrl, initialWeight, initialHeight, latestWeight (from most recent BodyMeasurement), latestBmi, activePlan name, lastMeasurementDate.

2. POST /api/fitness/measurements (TRAINER only):
   - Body: {memberId, weight, height, bodyFat?, chest?, waist?, hip?, biceps?, thigh?, notes?}
   - Backend auto-calculates: bmi = weight / (height/100)^2, round to 2 decimal places.
   - Validation: weight 30–300 kg, height 100–250 cm. Reject height=0 to prevent division by zero.
   - Create BodyMeasurement record.
   - Return: {success, measurement: {id, logDate, bmi, weight}}

3. GET /api/fitness/progress/:memberId (TRAINER, MEMBER, ADMIN):
   - Query: ?range=30d|3m|6m|all
   - Return all BodyMeasurement rows in date range, sorted by logDate ASC.
   - If a metric field (bodyFat, chest, etc.) is null, include it as null (do not substitute 0).

4. POST /api/fitness/workouts (TRAINER only):
   - Body: {memberId, title, description, exercises: [{exerciseName, sets, reps, targetWeight?, videoUrl?, notes?}]}
   - In ONE Prisma transaction: Create WorkoutPlan, bulk create all WorkoutExercise rows, create WorkoutAssignment linking plan to member.
   - Return: {success, assignmentId}

5. GET /api/fitness/workouts?memberId=uuid (TRAINER, MEMBER):
   - Return active WorkoutAssignment for that member with full plan + exercises.

6. POST /api/fitness/diets (TRAINER only):
   - Body: {memberId, title, breakfast, lunch, dinner, snacks, targetCalories, targetProtein, targetCarbs, targetFats, targetWaterMl}
   - Create DietPlan. Return {success, dietPlan: {id, title}}

7. GET /api/fitness/diets?memberId=uuid (TRAINER, MEMBER):
   - Return active DietPlan for that member.

FRONTEND (Next.js 15):
1. /trainer/page.tsx — Trainer Dashboard:
   - Glassmorphic grid of assigned member cards. Each card: avatar, member ID, name, current weight vs initial weight (progress bar showing delta), last measurement date.
   - 3 quick action icon buttons per card: 📏 (→ /trainer/members/[id]/measurements), 💪 (→ /trainer/members/[id]/workouts), 🥗 (→ /trainer/members/[id]/diet).
   - Search bar filtering members by name in real-time.
   - Recent Activity Feed on the right: last 10 workout completions and diet logs from assigned members.

2. /trainer/members/[id]/measurements/page.tsx — Measurement Logger:
   - Input grid: Weight (kg), Height (cm), Body Fat (%), Chest, Waist, Hip, Biceps, Thigh (all in inches, optional), Notes (textarea).
   - Live BMI Preview: computed in real-time as trainer types weight and height. Show BMI value with color: <18.5=blue/underweight, 18.5–24.9=green/normal, 25–29.9=amber/overweight, ≥30=rose/obese.
   - Submit → POST /api/fitness/measurements.
   - Below form: Mini Recharts line chart of last 6 weight values. Full history table (date, weight, BMI, body fat, waist) with color-coded delta column.

3. /trainer/members/[id]/workouts/page.tsx — Workout Plan Builder:
   - Dynamic exercise table. Each row: Exercise Name (text input), Sets (number), Reps (number), Target Weight kg (number), Demo Video URL (text), Notes (text). "Delete Row" button.
   - "+ Add Exercise" button appends a new empty row.
   - Plan Title and Description inputs at the top.
   - "Save & Assign Plan" button → POST /api/fitness/workouts.
   - Below: Show existing active plan (if any) with option to view exercises and "Archive Plan" action.

4. /trainer/members/[id]/diet/page.tsx — Diet Planner:
   - Macro input panel: Target Calories (kcal), Protein (g), Carbs (g), Fats (g), Water (ml).
   - Live Donut Chart (Recharts PieChart): updates as trainer types. Segments: Protein (purple), Carbs (cyan), Fats (amber). Show percentage per macro.
   - Calorie Validation indicator: Show "✓ Macros add up correctly" in green if (protein×4 + carbs×4 + fats×9) is within ±10% of targetCalories. Show warning if off.
   - 4 rich textarea fields: Breakfast, Lunch, Snacks, Dinner. Character count displayed.
   - "Save Diet Plan" button → POST /api/fitness/diets.

=== DESIGN RULES ===
- Member cards on trainer dashboard use listContainer/listItem stagger animation from animations.ts.
- BMI live preview must feel responsive — update on every keystroke, no debounce needed here.
- The workout builder table rows should animate in/out using Framer Motion AnimatePresence.
- The macro donut chart must update smoothly in real-time as inputs change (use state-driven data array).

=== PHASE COMPLETION REPORT (REQUIRED) ===
At the end, provide:
1. ✅ List of every new file created and every existing file modified.
2. 🔑 Any NEW environment variables added.
3. ⚠️ Any information missing from me (e.g., are there existing workout templates to pre-populate? Any specific exercise library to use?).
4. 📋 Manual steps I must complete.
5. 🧪 Test steps: Log in as a Trainer → see assigned members → add a measurement → verify BMI calculated in DB → build a 3-exercise workout → assign it → verify WorkoutAssignment created.
6. 🔒 Security verification step: Confirm that hitting GET /api/payments/ledger with a Trainer JWT returns 403.
```

---

---

## 📦 Phase 6 Prompt — Member Portal

```
@design.md @06_phase_member_portal.md

You are building Phase 6 of the Gym Membership Management System.

=== PHASE DEPENDENCY ===
Phases 1–5 are COMPLETE. The following already exist and work:
- /member/page.tsx (QR widget + basic membership card from Phase 4).
- GET /api/fitness/progress/:memberId — returns BodyMeasurement history.
- GET /api/fitness/workouts?memberId — returns active workout plan.
- GET /api/fitness/diets?memberId — returns active diet plan.
- WorkoutProgress, DietLog models exist in schema.
- Payment records exist in DB (from Phase 3).
Do NOT rebuild anything from Phases 1–5. The /member/page.tsx built in Phase 4 is the starting point — extend it, do not replace it.

=== WHAT TO BUILD ===

BACKEND (Express.js):
1. POST /api/fitness/workouts/progress (MEMBER only):
   - Body: {memberId, assignmentId, completed: true, feedback: "string"}
   - Create WorkoutProgress record.
   - Return {success, logId}

2. POST /api/fitness/diet-logs (MEMBER only):
   - Body: {memberId, dietPlanId, waterIntakeMl, caloriesLog, proteinLog}
   - Validate: reject all negative values (server-side). Return 400 if any value < 0.
   - Create DietLog record.
   - Compute and return totalWaterLoggedToday (sum of all DietLog.waterIntakeMl for this member today).
   - Return {success, totalWaterLoggedToday}

3. GET /api/fitness/diet-logs/today (MEMBER only):
   - Query: ?memberId=uuid&date=YYYY-MM-DD
   - Aggregate all DietLog records for member on that date (using local date, not UTC).
   - If no DietPlan assigned, return default targets: calories=2000, protein=100, water=3000.
   - Return {target: {calories, protein, water}, consumed: {calories, protein, water}}

FRONTEND (Next.js 15):
1. /member/progress/page.tsx — Personal Progress Analytics:
   - Time range filter pill tabs: 30 Days | 3 Months | 6 Months | All Time. Changes the date query to GET /api/fitness/progress/:memberId.
   - Weight & BMI Dual-Axis ComposedChart (Recharts): Left Y-axis = Weight(kg) with neon purple gradient area fill. Right Y-axis = BMI with cyan dashed line. Custom glassmorphic tooltip from design.md.
   - Body Fat % Line Chart: Neon rose gradient fill. Only renders if bodyFat data exists (skip nulls — do NOT substitute 0).
   - Circumference panel: Latest values for Chest, Waist, Hip, Biceps, Thigh displayed as labeled metric cards.
   - History Table: Columns: Date, Weight, BMI, Body Fat%, Waist. Delta column comparing to previous entry — green if improving (weight down/BMI down), red if regressing.

2. /member/workouts/page.tsx — Workout Tracker:
   - Fetch active workout from GET /api/fitness/workouts?memberId.
   - Show plan title and description at top.
   - Exercise rows as glassmorphic checklist cards: Exercise name, Sets × Reps, Target Weight, Notes. Checkbox to mark complete. "Watch Form" button.
   - Checkbox animation: Framer Motion spring (stiffness:600, damping:30). Checked item gets a strikethrough and 30% opacity.
   - "Watch Form" opens a fullscreen modal overlay with iframe/video player.
   - Progress bar: "X of Y exercises completed."
   - "Submit Workout" button enabled only when ALL boxes checked. Opens feedback textarea modal. On submit → POST /api/fitness/workouts/progress.
   - Local storage key: `workout_checklist_${memberId}_${YYYY-MM-DD}`. Resets on date change.
   - Rest Day state: If no active workout, show centered card: "🌙 Rest Day. Relax and recover!"

3. /member/diet/page.tsx — Diet & Nutrition Tracker:
   - Fetch: GET /api/fitness/diets?memberId (meal schedule), GET /api/fitness/diet-logs/today (current progress).
   - 4 meal section accordion cards (Breakfast, Lunch, Snacks, Dinner): Show trainer's meal text. Input fields to log calories (kcal) and protein (g) consumed per meal. Submit → POST /api/fitness/diet-logs.
   - Water Hydration Widget: SVG animated container (bottle or cylinder). Fluid level = min(waterLogged/targetWater, 1.5) × 100%. Smooth CSS height transition on update. Quick log buttons: "+250ml", "+500ml", "+1000ml" — each fires POST /api/fitness/diet-logs with only waterIntakeMl. Apply tapScaling Framer Motion animation.
   - Macro Progress Rings: 3 circular SVG progress indicators. Purple ring = Calories, Cyan ring = Protein, Blue ring = Water. Show "Xg / Yg" inside each ring.
   - Default fallback: If no diet plan assigned, show placeholders with default targets (2000 kcal, 100g protein, 3000ml water).

4. /member/invoices/page.tsx — Payment History:
   - Fetch GET /api/payments/member/:memberId.
   - Table: Invoice #, Date, Plan Name, Amount, Status badge.
   - Download PDF button per row → call exportInvoicePdf(payment, memberProfile) from Phase 3.

=== DESIGN RULES ===
- Charts MUST use the CustomGlassTooltip pattern from design.md.
- Water widget must feel alive — smooth SVG fill animation, not a simple percentage bar.
- Workout checklist items must stagger in using listContainer/listItem from animations.ts.
- All form submits (water log, meal log, workout complete) must show an instant optimistic UI update before the API resolves.

=== PHASE COMPLETION REPORT (REQUIRED) ===
At the end, provide:
1. ✅ List of every new file created and every existing file modified.
2. 🔑 Any NEW environment variables added.
3. ⚠️ Any missing information you need from me (e.g., should video URLs support YouTube embeds or only Supabase Storage URLs?).
4. 📋 Manual steps I must complete.
5. 🧪 Test steps: Log in as a Member → view QR → go to Progress (verify charts render) → go to Workouts (check off exercises → submit feedback) → go to Diet (log 500ml water → verify fluid widget rises) → go to Invoices (download PDF).
6. ✅ Verify: Submitting negative calorie value returns 400.
```

---

---

## 📦 Phase 7 Prompt — Reports, Notifications & Final Polish

```
@design.md @07_phase_reports_notifications_polish.md

You are building Phase 7 — the final phase of the Gym Membership Management System.

=== PHASE DEPENDENCY ===
Phases 1–6 are COMPLETE. The entire system is functional:
- Admin module, Payments, QR Attendance, Trainer Portal, Member Portal — all built.
- /admin/reports/page.tsx exists from Phase 3 but only shows placeholders.
- Notification model exists in schema (from Phase 1 migration).
Do NOT rebuild anything from Phases 1–6. Complete and polish only.

=== WHAT TO BUILD ===

BACKEND (Express.js):
1. Report Generation APIs (ADMIN, SUPER_ADMIN only):
   - GET /api/reports/revenue?startDate&endDate — Aggregate Payment data by month + method.
   - GET /api/reports/attendance?startDate&endDate&memberId? — Attendance records with member names.
   - GET /api/reports/members — All members with current membership status.
   - GET /api/reports/weight-progress?startDate&endDate&memberId? — BodyMeasurement history.
   - All return JSON. Formatting/export is handled client-side.

2. Notification APIs:
   - POST /api/notifications/send (ADMIN, SUPER_ADMIN, TRAINER) — Create a Notification record.
   - GET /api/notifications/my (any authenticated user) — Return user's notifications, unread first, sorted by sentAt DESC.
   - PUT /api/notifications/:id/read — Mark as read.

3. Cron Jobs (install node-cron):
   - Daily at 9:00 AM: Check members expiring in ≤7 days → create Notification records.
   - Daily at 9:00 AM: Check members with birthday today → create birthday Notification.
   - Daily at 9:00 AM: Check Payment records with status=PENDING older than 3 days → create payment due Notification.

FRONTEND (Next.js 15):
1. /admin/reports/page.tsx — Complete the placeholder from Phase 3:
   - 4 tab sections: Revenue, Attendance, Members, Weight Progress.
   - Date range pickers per tab.
   - Format selector: CSV | Excel | PDF.
   - "Generate Report" button → fetch data from API → export in chosen format.
   - Install papaparse (CSV export) and xlsx (Excel export).
   - PDF reports: Use jsPDF (already installed from Phase 3) — generate a styled table PDF.
   - Preview section: Show first 10 rows of data in a table below the controls.

2. Notification Bell in DashboardShell.tsx — Update the existing shell:
   - Add a Bell icon to the top header bar.
   - Red badge showing unread notification count (GET /api/notifications/my on load, filter isRead=false).
   - Click opens a slide-down glassmorphic panel (AnimatePresence, slide from top).
   - List: notification title, message, time ago, "Mark Read" button per item.
   - Unread items have a neon purple left border. Read items are dimmer.
   - "Mark All Read" button at top of panel.

3. Mobile Responsiveness — Audit and fix ALL pages:
   - DashboardShell.tsx: On screens <768px, hide sidebar. Show hamburger menu button in header. Clicking opens a glassmorphic bottom sheet drawer (slide up, AnimatePresence) with the same navigation items.
   - All Recharts charts: Wrap in <ResponsiveContainer width="100%" height={300}>. Verify they don't overflow on 375px screens.
   - All data tables (/admin/members, /admin/payments, /admin/reports): On screens <640px, convert rows to vertical stacked card views.
   - Member diet water widget: Verify SVG scales correctly on mobile.
   - All forms: Verify touch targets are large enough (min 44px height on buttons/inputs).

4. Performance & Final Polish:
   - Add <Suspense> with skeleton loaders (shimmer effect using CSS animation) to ALL data-fetching pages.
   - Use next/image for all avatar images.
   - Add loading spinner states for all form submit buttons (disable button + show spinner while API call is in progress).
   - Add proper toast notifications for all success/error states across the app (use shadcn/ui Toast or a library like react-hot-toast).
   - Verify all page titles (document title / <title> tags) are set correctly.
   - Add 404 page (src/app/not-found.tsx) — glassmorphic dark style.
   - Add error boundary (src/app/error.tsx) — glassmorphic dark style.

5. Security Final Audit:
   - Verify ALL /api/admin/* routes reject TRAINER and MEMBER tokens (403).
   - Verify ALL /api/payments/* routes reject TRAINER tokens (403).
   - Verify member data endpoints check that the requester owns the data (cannot fetch another member's data).
   - Verify no sensitive data (JWT secret, QR salt, DB credentials) appears anywhere in frontend code.

=== PHASE COMPLETION REPORT (REQUIRED) ===
At the end, provide:
1. ✅ Complete list of ALL files created or modified across the entire project (summary by phase).
2. 🔑 ALL environment variables across the ENTIRE project — complete final .env and .env.local templates with placeholder values and descriptions.
3. 📋 Final manual checklist of everything I need to do before the app is production-ready:
   - Supabase configurations
   - Firebase project setup (if notifications are using FCM)
   - Any database seeds needed
   - Any Prisma migration steps
4. 🧪 Complete end-to-end test plan:
   - Admin flow (login → create member → record payment → scan QR → view reports)
   - Trainer flow (login → log measurement → assign workout → assign diet)
   - Member flow (login → view QR → complete workout → log diet → download invoice)
5. ⚠️ Any known limitations or features deferred to future phases.
6. 🚀 Steps to deploy the app (frontend to Vercel, backend to Railway/Render).
```

---

---

## 📋 Quick Reference — Phase Order & What Each Unlocks

```
Phase 1 → Auth system, DB schema, UI shell
    └── Unlocks: Phase 2 (has auth + DB)

Phase 2 → Members, Plans, QR token generation
    └── Unlocks: Phase 3 (has members), Phase 4 (has QR tokens)

Phase 3 → Payments, Invoices, Admin Dashboard
    └── Unlocks: Phase 6 (member invoices page needs payment records)

Phase 4 → QR Attendance scanner, Member Home with QR display
    └── Unlocks: Phase 6 (member home is extended, not replaced)

Phase 5 → Trainer portal, workouts, diet plans, body measurements
    └── Unlocks: Phase 6 (member portal reads trainer-created data)

Phase 6 → Member portal — progress charts, workout checklist, diet tracker
    └── Unlocks: Phase 7 (all features exist, now polish + reports)

Phase 7 → Reports, notifications, mobile, performance, security audit
    └── Final — production-ready system
```

---

## 🔑 Master Environment Variables Reference

Here are all environment variables across the full project. The agent should confirm each of these is set after the phase that introduces them:

### Backend `.env`
```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Authentication
JWT_SECRET=your-very-long-random-secret-key-here
JWT_EXPIRES_IN=7d

# QR Tokens
QR_SECRET_SALT=your-qr-hmac-salt-string

# Supabase (for file uploads from backend)
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Server
PORT=3001
NODE_ENV=development
```

### Frontend `.env.local`
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase (for client-side file uploads)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Firebase (Phase 7 — notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```
