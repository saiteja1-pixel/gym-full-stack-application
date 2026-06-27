# Phase 2 — Admin Module

> **Goal:** Build the complete administrative control center — member registration (with document uploads and QR generation), membership plan management, member directory with search/filter, individual member profiles, and trainer assignment workflows.
>
> **Depends on:** Phase 1 (Auth middleware, DB schema, DashboardShell)

**Source PRDs:**
- [01_admin_module.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/01_admin_module.md)
- [design.md §2, §3, §4](file:///c:/Users/HP/Downloads/full stack application/design.md)

---

## 1. Scope & Objectives
- Admin can **Create, Read, Update, Delete** members.
- Auto-generate unique **Member ID** (`CF-2026-0001` format) and **cryptographic QR token**.
- Upload **profile photos** and **ID proof documents** to Supabase Storage.
- Create and manage **Membership Plans** (Monthly, Quarterly, Semi-Annual, Annual, Custom).
- **Assign trainer** and **membership plan** to members.
- Support plan **Upgrade, Downgrade, Freeze, Extend, Renew** operations.
- Super Admin can perform all operations across all branches.

---

## 2. Database Models Involved
| Model | Operations |
|---|---|
| `Member` | CREATE, READ, UPDATE |
| `User` | CREATE (during member registration) |
| `MembershipPlan` | CREATE, READ, UPDATE |
| `Membership` | CREATE, UPDATE (status, dates) |
| `Trainer` | READ (for assignment dropdown) |

---

## 3. Backend API Endpoints

### 3.1 Membership Plan APIs

#### `POST /api/admin/membership-plans` — Create Plan
- **Requires:** `ADMIN` or `SUPER_ADMIN` role
- **Body:**
  ```json
  {
    "name": "Gold Annual Package",
    "price": 10000.00,
    "duration": "ANNUAL",
    "durationDays": 365,
    "joiningFee": 500.00,
    "gstPercent": 18.0,
    "freezeDays": 15,
    "description": "Full-year access with 15 freeze days"
  }
  ```
- **Response (201):** Created plan object

#### `GET /api/admin/membership-plans` — List All Plans
- **Requires:** `ADMIN`, `SUPER_ADMIN`, `MEMBER` (for selection)
- **Response (200):** Array of active plans

#### `PUT /api/admin/membership-plans/:id` — Update Plan
- **Requires:** `ADMIN` or `SUPER_ADMIN`
- **Body:** Any plan fields to update

### 3.2 Member Management APIs

#### `POST /api/admin/members` — Register Member
- **Requires:** `ADMIN` or `SUPER_ADMIN`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "dob": "1995-04-15T00:00:00.000Z",
    "gender": "MALE",
    "emergencyContact": "Jane Doe - 9876543211",
    "initialHeight": 178.5,
    "initialWeight": 82.0,
    "trainerId": "trainer-uuid-1234",
    "planId": "plan-uuid-5678"
  }
  ```
- **Execution Logic (Prisma Transaction):**
  1. Check if email already exists in `User` table → return 409 if duplicate.
  2. Hash default password (`CoreFit2026!`) with bcrypt (12 rounds).
  3. Generate sequential `memberId`: query latest CF-YYYY-XXXX count + 1.
  4. Generate `qrCodeToken` using HMAC-SHA256:
     ```javascript
     crypto.createHmac('sha256', process.env.QR_SECRET_SALT)
           .update(`${memberId}-${email}-${Date.now()}`)
           .digest('hex')
     ```
  5. Calculate membership `startDate` = today, `endDate` = today + `durationDays`.
  6. Open `prisma.$transaction([...])`:
     - Create `User` with role `MEMBER`.
     - Create `Member` with all fields.
     - Create `Membership` linked to plan.
  7. Commit transaction.
- **Success Response (201):**
  ```json
  {
    "success": true,
    "member": {
      "id": "member-uuid-xyz",
      "memberId": "CF-2026-0001",
      "name": "John Doe",
      "qrCodeToken": "abcdef1234567890..."
    }
  }
  ```

#### `GET /api/admin/members` — List Members (Paginated)
- **Requires:** `ADMIN`, `SUPER_ADMIN`, `TRAINER`
- **Query:** `?search=John&status=ACTIVE&page=1&limit=10`
- **Response (200):**
  ```json
  {
    "members": [{ "memberId": "CF-2026-0001", "name": "John Doe", "membership": { "status": "ACTIVE", "endDate": "..." } }],
    "totalPages": 5,
    "currentPage": 1
  }
  ```

#### `GET /api/admin/members/:id` — Get Member Profile
- **Requires:** `ADMIN`, `SUPER_ADMIN`, `TRAINER`, linked `MEMBER`
- **Response (200):** Full member object including `membership`, `trainer`, `latestMeasurements`, `payments` (last 3).

#### `PUT /api/admin/members/:id` — Update Member Profile
- **Requires:** `ADMIN` or `SUPER_ADMIN`
- **Supports:** Name, phone, emergency contact, trainer reassignment, plan changes, membership freeze.

#### `PUT /api/admin/members/:id/freeze` — Freeze Membership
- **Body:** `{ "freezeDays": 10 }`
- **Logic:** Set `Membership.status = FROZEN`, record `freezeStart`, extend `endDate` by freeze days.

#### `PUT /api/admin/members/:id/renew` — Renew Membership
- **Body:** `{ "planId": "..." }`
- **Logic:** Create new `Membership` record, link to payment.

---

## 4. Frontend Routes & Pages

### 4.1 `src/app/(dashboard)/admin/memberships/page.tsx` — Plan Management
**UI Elements:**
- Grid of plan cards (glassmorphic), each showing name, price, duration, GST, freeze days.
- **Create Plan** button opens a side drawer form.
- Inline **Edit** and **Deactivate** actions on each card.
- Plans are categorized by `PlanDuration` enum values.

### 4.2 `src/app/(dashboard)/admin/members/page.tsx` — Member Directory
**UI Elements:**
- Search bar with real-time debounced search.
- Status filter tabs: **All | Active | Expired | Frozen**.
- Data table / grid showing: Member ID, Name, Phone, Plan Name, Expiry Date, Status badge.
- Status badge colors: `ACTIVE` = emerald, `EXPIRED` = rose, `FROZEN` = amber.
- Click row → navigate to member profile.
- **Add Member** button → `/admin/members/new`.

### 4.3 `src/app/(dashboard)/admin/members/new/page.tsx` — Register Member
**Multi-step Form (3 steps):**

**Step 1 — Personal Information:**
- Name, Email, Phone, Date of Birth, Gender (dropdown), Emergency Contact.

**Step 2 — Physical Baseline & Assignments:**
- Initial Height (cm), Initial Weight (kg).
- Assign Trainer (searchable dropdown from API).
- Select Membership Plan (card selection from API).

**Step 3 — Documents:**
- Profile Photo: Webcam capture component **OR** file upload.
- ID Proof: PDF/image file upload.
- Preview before submitting.
- On submit: Upload files to Supabase Storage → get URLs → POST to `/api/admin/members` with all data.

### 4.4 `src/app/(dashboard)/admin/members/[id]/page.tsx` — Member Profile
**Sections:**
- **Header:** Avatar, Member ID, Name, Status badge, "Edit" button.
- **Info Cards:** Contact info, plan details (start/end dates, days remaining countdown), trainer assigned.
- **Membership Actions:** Freeze, Renew, Upgrade, Downgrade — each opens a confirmation modal.
- **Quick Stats:** Last check-in, total visits this month, latest weight.

---

## 5. QR Code Display for Newly Registered Members
After successful registration, show a modal with:
- The generated QR code image (rendered using `qrcode.react`).
- The `memberId` and `qrCodeToken`.
- Download QR button (saves QR image as PNG).

---

## 6. Component Architecture
```
src/components/admin/
├── MemberCard.tsx            ← Grid card for member listing
├── PlanCard.tsx              ← Membership plan display card
├── MemberRegistrationForm/
│   ├── Step1PersonalInfo.tsx
│   ├── Step2Assignments.tsx
│   └── Step3Documents.tsx
├── FreezeModal.tsx
├── RenewModal.tsx
└── QRGeneratedModal.tsx
```

---

## 7. Phase 2 Completion Checklist
- [ ] Implement `POST /api/admin/membership-plans` with validation
- [ ] Implement `GET /api/admin/membership-plans`
- [ ] Implement `PUT /api/admin/membership-plans/:id`
- [ ] Implement `POST /api/admin/members` with full Prisma transaction + QR token generation + sequential member ID
- [ ] Implement `GET /api/admin/members` with pagination, search, and status filters
- [ ] Implement `GET /api/admin/members/:id` with all nested relations
- [ ] Implement `PUT /api/admin/members/:id` for profile edits
- [ ] Implement `PUT /api/admin/members/:id/freeze` with freeze day logic
- [ ] Implement `PUT /api/admin/members/:id/renew` with new membership creation
- [ ] Build Supabase Storage upload helpers for avatar and ID proof files
- [ ] Build Membership Plans management page (`/admin/memberships`)
- [ ] Build Member Directory page with search, filters, and status badges (`/admin/members`)
- [ ] Build 3-step Member Registration form (`/admin/members/new`) with webcam capture and file upload
- [ ] Build Member Profile page with all sections and action modals (`/admin/members/[id]`)
- [ ] Integrate `qrcode.react` for QR generation display on registration success
- [ ] Verify transaction rollback: Ensure a failed step (e.g., duplicate email) rolls back all database records
- [ ] Verify document upload: Check Supabase bucket contains files with correct member folder path
- [ ] Verify RBAC: A `TRAINER` token cannot access `POST /api/admin/members`
