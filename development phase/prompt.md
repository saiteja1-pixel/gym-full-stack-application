# AI Coding Agent Development Prompts

This document contains copy-pasteable prompts to guide an AI coding agent through the step-by-step development of the **Core Fit Club — Gym Membership Management System**.

## 🔴 Global Agent Instructions & Development Rules
*(Include these rules at the beginning of **EVERY** prompt you give to the agent)*

1. **Incremental Phase-by-Phase Development:** You must develop one phase at a time. Do not begin work on Phase $N+1$ until Phase $N$ is completely developed, verified, and approved.
2. **Phase Integration & Linkage:** Each phase builds upon the database schemas, API endpoints, authentication flows, and UI layouts of the previous phases. You must preserve existing functionalities and integrate the new module cleanly without breaking or duplicating code.
3. **No Placeholders or Mock Logic:** Write production-quality code. Forms must validate data, APIs must communicate with the database, and pages must show real database data. Do not use temporary mock pages, static placeholder components, or bypass API calls.
4. **Strict Theme & Design Tokens:** Follow the **Glassmorphic Dark UI Theme** defined in [design.md](file:///c:/Users/HP/Downloads/full%20stack%20application/design.md) exactly. Use the CSS variables and Tailwind classes defined in `globals.css` (neon purple/cyan accents, blurred panels, custom inputs).
5. **Security & Secrets:** Never hardcode sensitive details (JWT secrets, DB credentials, API keys). Always use `.env` (backend) or `.env.local` (frontend).
6. **Mandatory Phase Completion Report:** At the end of every phase, you MUST stop and provide a **Phase Completion Report** containing:
   - **✅ What was built:** A clear list of files created or modified.
   - **🔑 Environment Variables:** Any new `.env` or `.env.local` keys added, including their descriptions and instructions on how to set them.
   - **⚠️ Missing Information:** A list of any missing parameters, keys, or details you need from me to proceed.
   - **📋 Manual Action Items:** Setup tasks I need to do (e.g. database migrations, creating Supabase buckets, configuring Firebase).
   - **🧪 Verification Plan:** Step-by-step instructions (API tests, UI checks, database verifications) to prove the phase works correctly.

---

## 📦 Phase 1 Prompt — Foundation & Infrastructure

```markdown
@design.md @01_phase_foundation_and_infrastructure.md

You are building Phase 1 of the Gym Membership Management System called "Core Fit Club".
Your goal is to initialize the project skeleton, database schema, Prisma migrations, JWT authentication middleware, global UI design tokens, and dashboard layout.

=== PHASE CONNECTION & DEPENDENCY ===
- This is the base foundation. All subsequent phases (2–7) depend on this being fully functional.
- The Express backend and Next.js frontend will communicate via JWT-secured REST APIs.

=== WHAT TO BUILD ===

1. BACKEND SETUP (Express.js):
   - Initialize a Node.js Express project in the `backend/` directory.
   - Install dependencies: `express`, `cors`, `helmet`, `dotenv`, `prisma`, `@prisma/client`, `jsonwebtoken`, `bcrypt`.
   - Create the full `prisma/schema.prisma` file with all 14 models and 6 enums as specified in design.md Section 3 (User, Admin, Trainer, Member, MembershipPlan, Membership, Payment, Attendance, BodyMeasurement, WorkoutPlan, WorkoutExercise, WorkoutAssignment, WorkoutProgress, DietPlan, DietLog, Notification).
   - Run the initial database migration: `npx prisma migrate dev --name init_full_schema` to push to Supabase PostgreSQL.
   - Implement authorization middleware in `middleware/auth.js` with `authenticateJWT` and `requireRole`.
   - Implement `POST /api/auth/login` (verifies email/password against database User records, generates signed JWT).
   - Implement `GET /api/auth/me` (reads JWT, queries database, and returns the full profile including role-based sub-profile data).

2. FRONTEND SETUP (Next.js 15):
   - Initialize a Next.js 15 project with TypeScript, Tailwind CSS, and shadcn/ui in the `frontend/` directory.
   - Install UI dependencies: `framer-motion`, `recharts`, `lucide-react`, `@tanstack/react-query`.
   - Implement the Glassmorphic Dark UI design system tokens in `src/app/globals.css` (Section 1.1 & 1.2 of design.md). Add `.glass-panel`, `.glass-panel-hover`, and `.glass-input` classes.
   - Import 'Outfit' and 'Inter' Google Fonts.
   - Create Framer Motion animation presets in `src/lib/animations.ts` (`pageTransition`, `listContainer`, `listItem`, `interactiveHover`).
   - Create Landing page (`src/app/page.tsx`): A portal selector with cards linking to `/login?role=ROLE` (Admin, Trainer, Member).
   - Create Login page (`src/app/login/page.tsx`): Glassmorphic login card supporting email, password, and role selector. Sets JWT in `AuthContext` on success.
   - Create `src/context/AuthContext.tsx` to handle frontend user session state.
   - Create `src/components/DashboardShell.tsx` (dynamic sidebar navigation layout filtered by the user's role) and wrap dashboard pages in `src/app/(dashboard)/layout.tsx`.
   - Add dashboard page placeholders: `/admin`, `/trainer`, `/member` displaying "Dashboard Coming Soon".

3. SUPABASE STORAGE SETUP:
   - Provide manual instructions to create two storage buckets in the Supabase console: `avatars` (public bucket for profile photos) and `id-proofs` (private bucket for member registrations).

=== TECHNICAL RULES ===
- Follow the Glassmorphic dark styling EXACTLY as described in design.md.
- Ensure all API endpoints utilize error handling and return consistent JSON structures.
- Store database credentials and secrets in environmental files. Do not hardcode.

=== REQUIRED PHASE COMPLETION REPORT ===
At the end of your run, output:
1. ✅ List of all files created with their exact paths.
2. 🔑 All environment variables that must be added to backend `.env` and frontend `.env.local` to run this phase.
3. ⚠️ Any missing info or configurations you need from me to continue.
4. 📋 Manual tasks I need to do (e.g. Supabase dashboard setups, Prisma migrations).
5. 🧪 Detailed steps to verify that Auth API and frontend routing are working correctly.
```

---

## 📦 Phase 2 Prompt — Admin Module

```markdown
@design.md @02_phase_admin_module.md

You are building Phase 2 of the Gym Membership Management System, focusing on the Admin Module.
Your goal is to build membership plans configuration, member registration flow, and member profile management.

=== PHASE CONNECTION & DEPENDENCY ===
- Links to Phase 1: Reuses the Express server, database connection, and Prisma models migrated in Phase 1. Secures API routes using the authentication/RBAC middleware (`requireRole(['ADMIN', 'SUPER_ADMIN'])`). Integrates components inside the Next.js `DashboardShell` layout.
- Links to Phase 3 & 4: Member and Plan records created in this phase are required to record Payments (Phase 3) and validate QR Check-Ins (Phase 4).

=== WHAT TO BUILD ===

1. BACKEND APIS:
   - **Membership Plan endpoints** (Admin-only):
     - `POST /api/admin/membership-plans` (Create a plan containing price, duration, joining fee, GST %, freeze days, etc.)
     - `GET /api/admin/membership-plans` (List active plans)
     - `PUT /api/admin/membership-plans/:id` (Update plan parameters)
     - `DELETE /api/admin/membership-plans/:id` (Soft-delete by setting `isActive=false`)
   - **Member Management endpoints** (Admin-only):
     - `POST /api/admin/members` (Registers user. Use a Prisma transaction to: check email uniqueness, hash default password `CoreFit2026!`, generate unique member ID `CF-YYYY-XXXX`, generate HMAC-SHA256 `qrCodeToken` using `QR_SECRET_SALT` env, calculate membership start/end dates, and create User + Member + Membership rows atomic)
     - `GET /api/admin/members` (Paginated member list with search filters by name/phone/email and status tabs)
     - `GET /api/admin/members/:id` (Fetch full profile details, current active plan, trainer details, and physical baseline measurements)
     - `PUT /api/admin/members/:id` (Update member details)
     - `PUT /api/admin/members/:id/freeze` (Freezes membership by updating status to `FROZEN`, record freeze start, and extend membership end date by `freezeDays`)
     - `PUT /api/admin/members/:id/renew` (Renews plan: creates a new active Membership record)
   - **Supabase Storage upload helper**:
     - `POST /api/upload/avatar` (Saves profile pictures to Supabase `avatars` bucket)
     - `POST /api/upload/id-proof` (Saves PDF/images to Supabase `id-proofs` bucket)

2. FRONTEND UI:
   - `/admin/memberships/page.tsx`: Glassmorphic membership plan cards grid with actions to create, edit, and deactivate.
   - `/admin/members/page.tsx`: Paginated data table displaying members with search, status filters, and color-coded status badges (Active=emerald, Expired=rose, Frozen=amber).
   - `/admin/members/new/page.tsx`: 3-step registration wizard:
     - Step 1: Personal Profile (name, email, phone, DOB, emergency contacts)
     - Step 2: Fitness Baseline (height, weight, searchable trainer dropdown, plan selection)
     - Step 3: Document uploads (webcam capture or file upload for avatar, ID proof upload)
     - On successful form submission: POST upload to Supabase, save data to backend, and show a popup modal with the generated member ID and secure QR code.
   - `/admin/members/[id]/page.tsx`: Profile hub displaying contact info, countdown timer for plan expiry, trainer stats, and action dialog modals (Freeze, Renew, Edit, Upgrade/Downgrade).

=== TECHNICAL RULES ===
- Install required packages: `qrcode.react` (frontend) and `@supabase/supabase-js` (backend/frontend).
- Apply page transition animations (`pageTransition`) and list staggers (`listContainer`/`listItem`) from Phase 1.
- All forms must use the `.glass-input` styling with built-in client-side verification.

=== REQUIRED PHASE COMPLETION REPORT ===
At the end of your run, output:
1. ✅ List of all files created or modified.
2. 🔑 Any new environment variables introduced (e.g. `QR_SECRET_SALT`, `SUPABASE_SERVICE_KEY`).
3. ⚠️ Any missing info or configurations you need from me to continue.
4. 📋 Manual tasks I need to do (e.g. configuring Supabase storage policies, running database updates).
5. 🧪 Testing script: Exactly how to register a member, freeze a member, and verify they reflect properly in the database.
```

---

## 📦 Phase 3 Prompt — Payments & Invoicing

```markdown
@design.md @03_phase_payments_and_invoicing.md

You are building Phase 3 of the Gym Membership Management System, focusing on Payments and Invoicing.
Your goal is to build the billing engine, ledger history, analytics charts, and client-side PDF invoice generation.

=== PHASE CONNECTION & DEPENDENCY ===
- Links to Phase 2: Interacts with Members and Membership plans created in Phase 2. Recording a payment will update the member's Membership status (e.g., from PENDING/EXPIRED to ACTIVE).
- Links to Phase 6 & 7: Payment ledger entries will be queried by members on their invoices page (Phase 6) and exported in reports (Phase 7).

=== WHAT TO BUILD ===

1. BACKEND APIS:
   - `POST /api/payments/invoice` (Admin-only):
     - Body: `{ memberId, planId, amountPaid, totalAmount, taxAmount, method, notes }`
     - Logic: Generates auto-incrementing invoice number `INV-YYYY-XXXX`. Creates a Payment record. If status is `PAID`, updates the member's corresponding Membership status to `ACTIVE`.
   - `GET /api/payments/ledger` (Admin-only):
     - Query: `?startDate&endDate&status&method&page&limit`
     - Logic: Returns list of transactions and summary parameters (total revenue, pending payments, total invoice count, and monthly revenue groupings `[{ month, revenue }]`).
   - `GET /api/payments/member/:memberId` (Admin and Owner-Member only):
     - Returns invoice history for a specific member.

2. FRONTEND UI:
   - `/admin/page.tsx` (Dashboard landing conversion):
     - Replace the Phase 1 placeholder with the premium analytics dashboard.
     - Row of 7 Glassmorphic stat cards using `AnalyticsCard` component (Total Members, Active, Expired, Renewals in 7 Days, Today's Check-ins, Monthly Revenue, Pending Payments) with corresponding neon glow colors.
     - Revenue Trend Area Chart (Recharts) with neon purple gradient and custom glassmorphic tooltips.
     - Membership distribution donut chart.
     - Recent Activity Feed (list of last 10 actions like member signups, check-ins, payments).
   - `/admin/payments/page.tsx` (Financial Ledger):
     - Displays summary metrics cards.
     - Search and filter controls by date range, payment status, and payment method.
     - Paginated transaction data table showing invoices, amounts, tax, date, and download buttons.
     - "Record Payment" button triggering a popup modal. Select member, select plan, type amount. Automatically computes GST (18%) and total bill.
   - `/admin/reports/page.tsx` (Placeholder updates):
     - Structure the report configuration view (Revenue, Attendance, Members tabs, date picker, download formats CSV/Excel/PDF).
     - Display a preview table showing a placeholder message: "Exports will be fully functional in Phase 7."
   - `/member/invoices/page.tsx` (Member invoice list):
     - A list view of invoices for the logged-in member. Each row contains basic billing details and a "Download PDF" button.

3. PDF GENERATION UTILITY:
   - Create `src/lib/exportInvoicePdf.ts` using `jspdf` and `jspdf-autotable`.
   - Generates a styled, high-quality dark-themed layout: Core Fit logo, cyan accent text for title, white transaction details, tabular itemizations, and GST breakdowns.

=== TECHNICAL RULES ===
- Install required packages: `jspdf` and `jspdf-autotable` on the frontend.
- Utilize the exact Recharts area gradient definitions (`revenueGrad`) and custom tooltips specified in design.md Section 1.4.

=== REQUIRED PHASE COMPLETION REPORT ===
At the end of your run, output:
1. ✅ List of all files created or modified.
2. 🔑 Any new environment variables introduced in this phase.
3. ⚠️ Any missing details or configs needed from me.
4. 📋 Manual tasks I need to do.
5. 🧪 Testing script: Walk through recording a payment, generating an invoice, downloading the PDF, and checking if the membership status is updated in the database.
```

---

## 📦 Phase 4 Prompt — Attendance & QR System

```markdown
@design.md @04_phase_attendance_and_qr_system.md

You are building Phase 4 of the Gym Membership Management System, focusing on the QR Scanner and Check-in validation.
Your goal is to build the backend scanner endpoint and the frontend scanner portal.

=== PHASE CONNECTION & DEPENDENCY ===
- Links to Phase 2 & 3: Uses the member's cryptographic `qrCodeToken` generated during registration in Phase 2. Queries the Member's Membership status (Phase 2) and latest Payment status (Phase 3) to validate check-in permissions.
- Links to Phase 6 & 7: The Member Portal dashboard homepage (Phase 6) will render this secure QR code. The attendance data logged here feeds the analytics reports in Phase 7.

=== WHAT TO BUILD ===

1. BACKEND APIS:
   - Create `utils/generateQrToken.js` (Verify it uses the HMAC-SHA256 algorithm alongside the `QR_SECRET_SALT` env key).
   - `POST /api/attendance/scan` (Admin-only):
     - Body: `{ qrCodeToken }`
     - Logic: Performs 5 sequential security checks:
       1. Token resolves to a registered member. (If not, write Attendance log and return `404 INVALID_TOKEN`).
       2. Membership has not expired (membership end date >= today). (If expired, write Attendance log and return `400 EXPIRED_PLAN`).
       3. Membership status is `ACTIVE`. (If not, write log and return `400 FROZEN` or `CANCELLED`).
       4. Latest payment status is `PAID` or `PARTIAL`. (If not, write log and return `400 UNPAID`).
       5. Cooldown: The member has not logged a check-in within the last 60 minutes. (If logged, return `400 DUPLICATE`).
     - If all checks pass: Write an Attendance log with status `VALID`. Return 200 with name, avatar, plan name, and expiry date.

2. FRONTEND UI:
   - `/admin/scan/page.tsx` (Front desk scanning panel):
     - Install and integrate `html5-qrcode`.
     - Layout: Camera viewport window with a neon targeting boundary overlay.
     - Scan handler: Sends scanned token to `POST /api/attendance/scan` with user's JWT.
     - Valid scan feedback: Displays a full-screen emerald green alert overlay, shows member photo, name, plan, expiry, and play validation chime sound (if possible). Auto-fades out after 4 seconds.
     - Invalid scan feedback: Displays a pulsing rose-red warning card displaying the denial reason. Auto-fades out after 4 seconds.
     - Offline safety banner: Shows "No internet connection. Scanner offline." if `navigator.onLine` is false.
     - Sidebar feed: Displays list of the last 10 check-ins in real-time.
   - `/member/page.tsx` (Upgrade member home placeholder):
     - Top center: Secure QR Code component. Fetches `qrCodeToken` from `GET /api/auth/me` on component mount (never cache this token in localStorage).
     - Renders QR code using `qrcode.react`. Includes a "Refresh QR Code" button.
     - Displays membership dashboard: plan details, countdown timer, status banner alerts (flashing red for expired, orange for expiring in 7 days).
     - Quick Stats Row: Circular progress gauges for calories, workout completion, water target progress.

=== TECHNICAL RULES ===
- Install required packages: `html5-qrcode` (frontend).
- Ensure webcam video stream clean-up is executed properly on page transition or component unmount.
- Design extreme UI feedbacks (full screen colored slides) suitable for front-desk monitors.

=== REQUIRED PHASE COMPLETION REPORT ===
At the end of your run, output:
1. ✅ List of all files created or modified.
2. 🔑 Confirmation of env variables (e.g. `QR_SECRET_SALT`).
3. ⚠️ Any missing details or configs needed from me.
4. 📋 Manual tasks I need to do.
5. 🧪 Testing script: Scan a valid QR code and verify emerald screen. Scan it again within 5 minutes and verify duplicate rose screen. Check database records.
```

---

## 📦 Phase 5 Prompt — Trainer Portal

```markdown
@design.md @05_phase_trainer_portal.md

You are building Phase 5 of the Gym Membership Management System, focusing on the Trainer Portal.
Your goal is to build trainer-member mapping, physical metric loggers, workout plans, and diet planning modules.

=== PHASE CONNECTION & DEPENDENCY ===
- Links to Phase 2: Fetches members assigned to the trainer via the `trainerId` assigned in the Admin registration flow (Phase 2).
- Links to Phase 6: The schedules, macronutrient configurations, and workout routines saved here are loaded directly into the Member Portal (Phase 6).
- Security Boundary: Trainers must be blocked from accessing any payments or invoicing APIs (`/api/payments/*` should return 403).

=== WHAT TO BUILD ===

1. BACKEND APIS (Trainer-only):
   - `GET /api/trainer/members` (Retrieves list of members assigned to the logged-in trainer. Returns baseline weight, height, latest BMI, active plans, and last progress dates).
   - `POST /api/fitness/measurements` (Logs physical metrics: weight, height, body fat, waist, hips, chest, biceps. Auto-calculates BMI: `weight / (height/100)^2`. Validates parameters are within range).
   - `GET /api/fitness/progress/:memberId` (Returns progress trends of body measurements grouped by ranges `30d`/`3m`/`6m`/`all`).
   - `POST /api/fitness/workouts` (Saves a complete workout plan and assigns it. Performs a database transaction to create a `WorkoutPlan`, create bulk `WorkoutExercise` logs, and create a `WorkoutAssignment`).
   - `GET /api/fitness/workouts?memberId` (Fetches active workout schedules and exercises for the member).
   - `POST /api/fitness/diets` (Creates a macro-targeted `DietPlan` with meal logs).
   - `GET /api/fitness/diets?memberId` (Fetches the member's current active diet plan).

2. FRONTEND UI:
   - `/trainer/page.tsx` (Trainer Home):
     - Directory grid of assigned members showing profile pictures, BMI trends, and last check-ins.
     - Quick-action buttons next to each member for easy access to log metrics, assign workouts, or plan diets.
     - Sidebar feed showing recent workouts completed or meal logs from assigned members.
   - `/trainer/members/[id]/measurements/page.tsx` (Body Metric Logger):
     - Interactive form logging body fat, weight, height, and circumferences.
     - Real-time BMI indicator widget displaying color levels based on status (Underweight=blue, Normal=green, Overweight=amber, Obese=rose).
     - Trends chart displaying the last 6 logged weight points.
   - `/trainer/members/[id]/workouts/page.tsx` (Workout Builder):
     - Dynamic form table to configure plans. Add/Delete rows for exercise name, sets, reps, weight targets, instructions, and video demo URL.
     - Animation effect (`AnimatePresence`) for adding/removing exercises.
   - `/trainer/members/[id]/diet/page.tsx` (Diet Planner):
     - Macro configuration panel (Calories, Protein, Carbs, Fats, Water).
     - Real-time macros breakdown pie chart updating dynamically as values are typed.
     - Calorie balance indicator: valid checkmark shown if macro calories total match target calories within ±10% margin.

=== TECHNICAL RULES ===
- Verify role authorization limits: all routes must validate JWT role is `TRAINER`.
- Implement robust database transactions for multi-row entities like workout plans.

=== REQUIRED PHASE COMPLETION REPORT ===
At the end of your run, output:
1. ✅ List of all files created or modified.
2. 🔑 Any new environment variables introduced.
3. ⚠️ Any missing details or configs needed from me.
4. 📋 Manual tasks I need to do.
5. 🧪 Testing script: Log in as a Trainer, create a workout plan, log body metrics, and verify they save to the DB. Log in as a Trainer and try to query `/api/payments/ledger` to verify you receive a 403 Forbidden.
```

---

## 📦 Phase 6 Prompt — Member Portal

```markdown
@design.md @06_phase_member_portal.md

You are building Phase 6 of the Gym Membership Management System, focusing on the Member Portal.
Your goal is to build the member dashboard, progress analytics, daily workout checklists, diet track logs, and invoicing sheets.

=== PHASE CONNECTION & DEPENDENCY ===
- Links to Phase 4: Integrates inside the member home page layout (`/member/page.tsx`) initialized in Phase 4.
- Links to Phase 5: Reads workout routines, diet macro targets, and body metrics generated by trainers in Phase 5.
- Links to Phase 3: Connects to the billing ledger to download and preview invoices.

=== WHAT TO BUILD ===

1. BACKEND APIS:
   - `POST /api/fitness/workouts/progress` (Member-only: logs workout execution status and training feedback).
   - `POST /api/fitness/diet-logs` (Member-only: logs daily calorie/water intake. Rejects negative values).
   - `GET /api/fitness/diet-logs/today` (Member-only: aggregates total macros consumed today compared against targets).

2. FRONTEND UI:
   - `/member/progress/page.tsx` (Progress Tracker):
     - Charts tracking body changes over 30d/3m/6m/All ranges.
     - Composed line-bar chart for Weight (Y1) and BMI (Y2) with neon cyan/purple gradients.
     - Circumference metrics summary panel (Chest, Waist, Hip, Biceps).
     - Detailed history log table with green/red indicator deltas showing improvement/regression.
   - `/member/workouts/page.tsx` (Daily Workout Checklist):
     - Loads active workout plan assigned in Phase 5. Shows rest state message if no workout is assigned.
     - Renders exercises as glassmorphic cards with checkboxes.
     - Smooth strike-through and opacity animations on checked items.
     - "Watch Form" button opening an iframe demo overlay.
     - "Submit Workout" button sending feedback to the database. Uses local storage to cache checklist progress throughout the day.
   - `/member/diet/page.tsx` (Nutrition & Hydration Diary):
     - Displays meals planned by the trainer. Form fields to log actual macros eaten.
     - Animated water hydration widget: Bottle cylinder SVG filled dynamically based on logs (+250ml, +500ml quick log buttons).
     - Triple SVG progress rings (Calories, Protein, Water).
   - `/member/invoices/page.tsx` (Receipt page integration):
     - Fetches member transactions. Clicking download generates the PDF invoice (using the `exportInvoicePdf` tool from Phase 3).

=== TECHNICAL RULES ===
- Apply optimistic updates to forms so stats and widgets adjust instantly upon submission.
- Ensure all charts utilize the glassmorphic custom tooltip template.

=== REQUIRED PHASE COMPLETION REPORT ===
At the end of your run, output:
1. ✅ List of all files created or modified.
2. 🔑 Any new environment variables introduced.
3. ⚠️ Any missing details or configs needed from me.
4. 📋 Manual tasks I need to do.
5. 🧪 Testing script: Log in as a Member, view trainer plans, log 500ml water, log a workout, and download an invoice. Attempt to submit a negative food intake value and confirm the backend returns a 400 bad request.
```

---

## 📦 Phase 7 Prompt — Reports, Notifications & Final Polish

```markdown
@design.md @07_phase_reports_notifications_polish.md

You are building Phase 7, the final phase of the Gym Membership Management System.
Your goal is to build report exports, cron jobs, push/system alerts, mobile layouts, loading skeletons, and a final security audit.

=== PHASE CONNECTION & DEPENDENCY ===
- Links to All Phases: Pulls data from all database modules (Payments, Check-ins, Members, Metrics) for exports. Adds notifications directly to the Phase 1 layout shell. Inspects and refines responsive design across all screens built in Phases 1-6.

=== WHAT TO BUILD ===

1. BACKEND APIS & UTILITIES:
   - **Report APIs** (Admin-only):
     - `GET /api/reports/revenue` (aggregates monthly revenue and payment methods)
     - `GET /api/reports/attendance` (aggregates check-in logs by date)
     - `GET /api/reports/members` (returns statuses of all memberships)
     - `GET /api/reports/weight-progress` (returns measurement averages)
   - **Notifications APIs**:
     - `POST /api/notifications/send` (creates alert records)
     - `GET /api/notifications/my` (retrieves alerts for logged-in user, unread first)
     - `PUT /api/notifications/:id/read` (marks alert as read)
   - **Daily Cron jobs** (using `node-cron` scheduled at 9:00 AM daily):
     - Check memberships expiring in <= 7 days → create notification.
     - Check birthdays today → create notification.
     - Check pending payments older than 3 days → create notification.

2. FRONTEND UI:
   - `/admin/reports/page.tsx` (Full functionality):
     - Enables data fetching per category. Integrates export downloads for CSV (using `papaparse`), Excel (using `xlsx`), and PDF (using `jspdf` styled table).
     - Renders a 10-row preview grid before file download.
   - **Notification Center widget**:
     - Embeds a notification bell badge in the `DashboardShell.tsx` header.
     - Displays an unread count. Clicking toggles a slide-down glassmorphic drawer containing recent notifications.
     - Unread messages are styled with a neon purple border indicator. "Mark all as read" clears the alerts.
   - **Responsive UI Audit**:
     - On devices <768px, hides the desktop sidebar. Adds a mobile navigation bar in the header opening a slide-up sheet drawer.
     - Wraps charts in `<ResponsiveContainer>` preventing overflow on 375px screens.
     - Converts tables to card-lists on screens <640px.
   - **Shimmer Skeletons & UX details**:
     - Renders custom `<Suspense>` shimmer loading skeletons on all data-fetching dashboards.
     - Disables forms and shows spinners while API operations are active.
     - Connects toast alerts for actions.
     - Creates custom `/not-found` and `/error` error boundary pages in dark glassmorphic layouts.

3. SECURITY DEPLOYMENT AUDIT:
   - Audit role checks: confirm admin routes reject trainers and members.
   - Confirm member logs check ownership (a member cannot fetch details of other members).
   - Ensure credentials/secrets are not leaked in client-side code bundles.

=== TECHNICAL RULES ===
- Install required packages: `node-cron` (backend), `papaparse` (frontend), `xlsx` (frontend).

=== REQUIRED PHASE COMPLETION REPORT ===
At the end of your run, output:
1. ✅ List of all files created or modified.
2. 🔑 Complete master checklist of env keys for backend and frontend.
3. 📋 Final manual setup checklist (e.g. cron configurations, Supabase storage bucket security policies, database seeding).
4. 🧪 Complete End-to-End Test Plan (Admin, Trainer, and Member flows).
5. ⚠️ List of deferred features.
6. 🚀 Steps to deploy to production (Vercel and Railway/Render).
```
