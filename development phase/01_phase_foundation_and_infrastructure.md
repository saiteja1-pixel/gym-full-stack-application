# Phase 1 — Foundation & Infrastructure

> **Goal:** Initialize the entire project skeleton — monorepo layout, database schema, Prisma migrations, authentication middleware, global UI design tokens, and role-based routing shells. Every subsequent phase builds on top of this phase.

---

## 1. Scope & Objectives
- Initialize the **Next.js 15** frontend and **Express.js** backend codebases.
- Define the complete **Prisma ORM schema** for all 14 database models.
- Run the first **Supabase PostgreSQL** database migration.
- Implement **JWT authentication** and **RBAC middleware**.
- Build the **Glassmorphic Dark UI system** base (CSS tokens, utility classes, fonts, scroll styles).
- Create the **Landing page**, **Login page**, and **Dashboard Shell layout** with role-based navigation.
- Configure **Supabase Storage buckets** for avatars and ID documents.

---

## 2. Full Database Schema to Migrate (Prisma)

All models defined in [design.md §3](file:///c:/Users/HP/Downloads/full stack application/design.md) must be migrated in **one single initial migration**:

| Prisma Model | Purpose |
|---|---|
| `User` | Primary identity with email, passwordHash, and role enum |
| `Admin` | Branch admin profile linked to User |
| `Trainer` | Trainer profile with specialty, bio, avatar |
| `Member` | Member profile with QR token, physical baselines, doc URLs |
| `MembershipPlan` | Subscription templates (price, duration, GST, freeze days) |
| `Membership` | Active subscription instance per member |
| `Payment` | Financial ledger with invoice numbers |
| `Attendance` | QR scan check-in records |
| `BodyMeasurement` | Physical metrics per session |
| `WorkoutPlan` | Workout template created by trainer |
| `WorkoutExercise` | Individual exercise rows inside a plan |
| `WorkoutAssignment` | Links a plan to a member |
| `WorkoutProgress` | Member's daily completion log |
| `DietPlan` | Trainer-created meal and macro plan |
| `DietLog` | Member's daily food/water intake log |
| `Notification` | System alerts sent to users |

**Enums to define:**
```prisma
enum UserRole       { SUPER_ADMIN | ADMIN | TRAINER | MEMBER }
enum Gender         { MALE | FEMALE | OTHER }
enum PaymentStatus  { PAID | PENDING | PARTIAL | REFUNDED }
enum PaymentMethod  { CASH | UPI | CARD | BANK_TRANSFER }
enum PlanDuration   { MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL | CUSTOM }
enum MembershipStatus { ACTIVE | EXPIRED | FROZEN | CANCELLED }
```

### Migration Command
```bash
npx prisma migrate dev --name init_full_schema
```

---

## 3. Backend Setup (Express.js)

### 3.1 Project Structure
```
backend/
├── prisma/
│   └── schema.prisma
├── middleware/
│   ├── auth.js            ← JWT verification
│   └── rbac.js            ← Role-based access control
├── routes/
│   └── auth.js            ← /api/auth/login & /me
├── controllers/
│   └── authController.js
├── utils/
│   └── generateTokens.js
├── .env
└── server.js
```

### 3.2 Authentication Endpoints

#### `POST /api/auth/login`
- **Body:** `{ email, password }`
- **Logic:**
  1. Find user by email in `User` table.
  2. Compare password against `passwordHash` using `bcrypt`.
  3. Sign JWT containing `{ id, email, role }` with `process.env.JWT_SECRET`.
  4. Return token + role + basic profile.
- **Response (200):**
  ```json
  { "token": "jwt-string", "role": "ADMIN", "user": { "id": "...", "name": "..." } }
  ```

#### `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Logic:** Decode token → fetch full profile including sub-profile (Admin/Trainer/Member).
- **Response (200):** Full user object with nested profile.

### 3.3 RBAC Middleware (`middleware/auth.js`)
```javascript
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ error: 'Permission denied' });
  next();
};
```

---

## 4. Frontend Setup (Next.js 15)

### 4.1 App Router Directory Structure
```
src/
└── app/
    ├── layout.tsx                  ← Providers (Auth, ReactQuery, Theme)
    ├── globals.css                 ← Glassmorphic design tokens
    ├── page.tsx                    ← Landing page / Portal selector
    ├── login/
    │   └── page.tsx                ← Glassmorphic login card
    └── (dashboard)/
        ├── layout.tsx              ← DashboardShell (dynamic sidebar by role)
        ├── admin/
        │   └── page.tsx            ← Admin Dashboard placeholder
        ├── trainer/
        │   └── page.tsx            ← Trainer Dashboard placeholder
        └── member/
            └── page.tsx            ← Member Portal placeholder
```

### 4.2 Global CSS Design Tokens (`globals.css`)
Insert into `src/app/globals.css`:
```css
@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --glass-background: rgba(17, 17, 21, 0.6);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-border-hover: rgba(255, 255, 255, 0.16);
    --glass-blur: 16px;
    --primary: 263.4 90% 50.4%;          /* Neon Purple */
    --primary-glow: rgba(124, 58, 237, 0.3);
    --secondary: 191.6 91.4% 36.5%;      /* Electric Cyan */
    --secondary-glow: rgba(14, 116, 144, 0.3);
    --accent-emerald: 142.1 76.2% 36.3%;
    --accent-rose: 346.8 77.2% 49.8%;
    --accent-amber: 47.9 95.8% 51.2%;
    --font-sans: 'Outfit', 'Inter', system-ui, sans-serif;
  }
}

.glass-panel {
  background: var(--glass-background);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.37);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.glass-panel-hover:hover {
  border-color: var(--glass-border-hover);
  box-shadow: 0 12px 40px 0 rgba(0,0,0,0.5), 0 0 15px var(--primary-glow);
}
.glass-input {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  border-radius: 8px;
  backdrop-filter: blur(8px);
}
.glass-input:focus {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 10px var(--primary-glow);
  outline: none;
}
```

### 4.3 Dashboard Shell Component
Build `src/components/DashboardShell.tsx` — a dynamic sidebar that renders navigation items based on the user's `role` (ADMIN / TRAINER / MEMBER). Sidebar items:
- **ADMIN:** Analytics, Members, Plans, Payments, Scan Check-In, Reports
- **TRAINER:** Dashboard, Assigned Members
- **MEMBER:** My Profile, Progress Logs, Workouts, Diet Tracker, Receipts

### 4.4 Framer Motion Animation Presets (`src/lib/animations.ts`)
```typescript
export const pageTransition = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.2 } }
};

export const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

export const listItem = {
  hidden: { opacity: 0, x: -10, scale: 0.95 },
  show: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 100 } }
};
```

---

## 5. Supabase Storage Configuration
Create two storage buckets:
- `avatars` — member profile photos (public read, authenticated write).
- `id-proofs` — member ID documents (private, authenticated only).

Apply **Row Level Security (RLS)** policies to restrict access to the authenticated member's own documents.

---

## 6. Environment Variables Required
```env
# Backend .env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
QR_SECRET_SALT=corefit_secure_salt
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Frontend .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 7. Phase 1 Completion Checklist
- [ ] Initialize Next.js 15 frontend project with TypeScript, Tailwind CSS, shadcn/ui
- [ ] Initialize Express.js backend project
- [ ] Install dependencies: `prisma`, `@prisma/client`, `bcrypt`, `jsonwebtoken`, `cors`, `helmet`
- [ ] Write full `schema.prisma` with all 16 models and 6 enums
- [ ] Connect Supabase PostgreSQL via `DATABASE_URL` and `DIRECT_URL`
- [ ] Run `npx prisma migrate dev --name init_full_schema`
- [ ] Implement `authenticateJWT` and `requireRole` middleware
- [ ] Implement `POST /api/auth/login` endpoint
- [ ] Implement `GET /api/auth/me` endpoint
- [ ] Write global `globals.css` with all design tokens and utility classes
- [ ] Import `Outfit` and `Inter` fonts from Google Fonts
- [ ] Build `DashboardShell.tsx` with role-based dynamic sidebar
- [ ] Build glassmorphic `Landing page` with role selector cards
- [ ] Build glassmorphic `Login page` with form validation
- [ ] Create Supabase Storage buckets (`avatars`, `id-proofs`) with RLS policies
- [ ] Set up all environment variables on both frontend and backend
- [ ] Write `src/lib/animations.ts` Framer Motion presets
- [ ] Test login flow end-to-end: login → JWT received → `/me` returns profile
- [ ] Verify `requireRole` blocks unauthorized roles with 403 response
