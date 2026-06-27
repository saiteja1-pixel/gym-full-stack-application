# Phase 7 — Reports, Notifications & Final Polish

> **Goal:** Complete the system with export-ready reports (CSV, Excel, PDF), Firebase Cloud Messaging push notifications (expiry reminders, announcements), full mobile responsiveness, performance optimizations, and a production readiness audit across all modules.
>
> **Depends on:** All previous phases (1–6) must be complete.

**Source PRDs:**
- [01_admin_module.md §5 Reports](file:///c:/Users/HP/Downloads/full stack application/project requirement document/01_admin_module.md)
- [PRD.md §7 Notifications, §8 Analytics](file:///c:/Users/HP/Downloads/full stack application/PRD.md)
- [08_system_architecture_and_security.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/08_system_architecture_and_security.md)
- [design.md §8 Verification & Performance Checklist](file:///c:/Users/HP/Downloads/full stack application/design.md)

---

## 1. Scope & Objectives

### Reports & Exports
- Generate and export **Revenue Report** (monthly totals, method breakdown).
- Generate and export **Attendance Report** (check-ins per member, daily counts).
- Generate and export **Payment Report** (status, method, GST).
- Generate and export **Member Report** (active/expired/frozen counts, registrations).
- Generate and export **Weight Progress Report** (per-member BMI/weight trajectory).
- Supported formats: **CSV**, **Excel (.xlsx)**, **PDF**.

### Push Notifications (Firebase Cloud Messaging)
- **Membership Expiry Reminder:** Auto-trigger 7 days before and 1 day before expiry.
- **Payment Due Alert:** Trigger when a `Payment.status === PENDING` is older than 3 days.
- **Birthday Wishes:** Trigger on member's DOB.
- **Gym Announcements:** Admin-composed broadcast to all members.
- **Trainer Messages:** Trainer-to-member direct notification.

### Mobile Responsiveness
- All pages must be fully usable on screens ≥ 375px wide.
- Sidebar converts to a **collapsible bottom drawer** on mobile.
- Charts scale down gracefully (Recharts `<ResponsiveContainer>`).
- Tables convert to vertical card stacks on mobile.

### Performance & Security Audit
- Hydration mismatch checks (Next.js SSR vs. client rendering).
- DB connection pooling validation (Prisma `DIRECT_URL` + `DATABASE_URL`).
- QR token caching for consecutive scans to reduce DB load.
- All routes protected with JWT + RBAC verification.
- SQL injection protection (Prisma ORM parameterized queries).
- Password hashing with bcrypt (12 rounds) confirmed.
- Supabase bucket RLS policies enforced.
- Audit log for sensitive admin actions (member deletion, plan downgrade).

---

## 2. Database Models Involved
| Model | Operations |
|---|---|
| `Notification` | CREATE (system-triggered), READ (by user) |
| `Payment` | READ (for report aggregation) |
| `Attendance` | READ (for attendance report) |
| `Member` | READ (for member report) |
| `BodyMeasurement` | READ (for weight progress report) |

### Notification Model Fields
```prisma
model Notification {
  id          String   @id @default(uuid())
  recipientId String   // references User.id
  title       String
  message     String
  isRead      Boolean  @default(false)
  sentAt      DateTime @default(now())
}
```

---

## 3. Backend API Endpoints

### 3.1 Report Generation APIs

#### `GET /api/reports/revenue` — Revenue Report
- **Requires:** `ADMIN`, `SUPER_ADMIN`
- **Query:** `?startDate=2026-01-01&endDate=2026-12-31&format=csv|excel|pdf`
- **Logic:** Aggregate `Payment` records by month. Group by `method` and `status`.
- **Response:** File download stream in requested format.

#### `GET /api/reports/attendance` — Attendance Report
- **Requires:** `ADMIN`, `SUPER_ADMIN`
- **Query:** `?startDate=...&endDate=...&memberId=...&format=csv|excel|pdf`
- **Response:** Check-in log table export.

#### `GET /api/reports/members` — Member Status Report
- **Requires:** `ADMIN`, `SUPER_ADMIN`
- **Response:** Summary table of all members with current membership status.

#### `GET /api/reports/weight-progress` — Weight Progress Report
- **Requires:** `ADMIN`, `SUPER_ADMIN`
- **Response:** Per-member BMI and weight log over selected date range.

### 3.2 Notification APIs

#### `POST /api/notifications/send` — Send Notification
- **Requires:** `ADMIN`, `SUPER_ADMIN`, or `TRAINER`
- **Body:**
  ```json
  {
    "recipientId": "user-uuid",
    "title": "Workout Updated",
    "message": "Your trainer has updated your workout plan for this week."
  }
  ```

#### `GET /api/notifications/my` — Get User's Notifications
- **Requires:** Authenticated user (any role)
- **Response:** Array of unread notifications, sorted by `sentAt` DESC.

#### `PUT /api/notifications/:id/read` — Mark as Read
- **Body:** _(empty)_
- **Response:** `{ "success": true }`

### 3.3 Automated Notification Cron Jobs (Backend)

```javascript
// cron/notificationJobs.js
const cron = require('node-cron');

// Run daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  // 1. Find members expiring in 7 days
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiringMembers = await prisma.membership.findMany({
    where: { endDate: { lte: sevenDaysLater }, status: 'ACTIVE' },
    include: { member: { include: { user: true } } }
  });

  for (const ms of expiringMembers) {
    await prisma.notification.create({
      data: {
        recipientId: ms.member.userId,
        title: 'Membership Expiring Soon',
        message: `Your membership expires on ${ms.endDate.toLocaleDateString()}. Renew now to avoid interruption.`
      }
    });
    // TODO: Send Firebase push notification
  }

  // 2. Birthday wishes
  const today = new Date();
  const birthdayMembers = await prisma.member.findMany({
    where: {
      dob: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    },
    include: { user: true }
  });

  for (const member of birthdayMembers) {
    await prisma.notification.create({
      data: {
        recipientId: member.userId,
        title: '🎂 Happy Birthday!',
        message: `Wishing you a wonderful birthday, ${member.name}! Keep crushing your fitness goals!`
      }
    });
  }
});
```

---

## 4. Frontend: Reports Page

### `src/app/(dashboard)/admin/reports/page.tsx` — Full Export Terminal
**Layout:**
- Four report type tabs: Revenue | Attendance | Members | Weight Progress.
- Date range picker (start date, end date) for each report.
- Format selector: **CSV**, **Excel**, **PDF**.
- **Generate & Download** button.
- Preview table below (first 10 rows of the report data).

**CSV Export (Client-side using `papaparse` or native):**
```typescript
import Papa from 'papaparse';

const exportCsv = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
};
```

**Excel Export (using `xlsx` library):**
```typescript
import * as XLSX from 'xlsx';

const exportExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
```

---

## 5. Frontend: Notification Center

### Notification Bell (Global in DashboardShell)
- Bell icon in top-right of header with unread count badge.
- Click opens a slide-down panel showing last 20 notifications.
- Each notification: title, message, time ago, "Mark as Read" button.
- Unread notifications shown with neon purple left border.

### Notification Alert Banner
- System alerts (expiry < 7 days) appear as inline colored banners on the Member Home page.

---

## 6. Mobile Responsiveness Specifications

### Sidebar → Mobile Bottom Drawer
```tsx
// On screens < 768px, convert sidebar to bottom sheet
const [drawerOpen, setDrawerOpen] = useState(false);

// Mobile: Hamburger menu icon in header
// Tap → AnimatePresence slide-up bottom sheet with navigation items
```

### Chart Responsiveness
All Recharts charts must be wrapped in `<ResponsiveContainer width="100%" height={300}>` to adapt to screen size.

### Table → Card Stack (Mobile)
On screens < 640px, data tables switch to vertically stacked card views per row for readability.

---

## 7. Performance Optimizations

### Next.js
- Use `Suspense` boundaries with skeleton loaders for all data-fetching pages.
- Use `next/image` for all avatar and document images.
- Enable ISR (Incremental Static Regeneration) for public landing page.

### QR Scanner Performance
- Cache last valid QR scan token in memory (not DB) for 5 seconds to avoid duplicate DB queries on consecutive camera frames.
- Limit scanner FPS to 10 to reduce CPU usage.

### Database
- Confirm `DATABASE_URL` (connection pool) and `DIRECT_URL` (direct connection for migrations) are both configured.
- Add indexes: `@@index([email])` on User, `@@index([memberId])` on Member, `@@index([memberId, checkInTime])` on Attendance.

---

## 8. Security Final Audit Checklist

| Item | Check |
|---|---|
| All `/api/admin/*` routes require `ADMIN` or `SUPER_ADMIN` | ✓ |
| All `/api/trainer/*` routes require `TRAINER` or `ADMIN` | ✓ |
| All `/api/payments/*` routes exclude `TRAINER` | ✓ |
| Member data endpoints validate that requester owns the data | ✓ |
| Passwords hashed with bcrypt 12 rounds | ✓ |
| Supabase Storage uses Row Level Security | ✓ |
| Prisma uses parameterized queries (no raw SQL injection risk) | ✓ |
| JWT tokens expire after 7 days | ✓ |
| QR token never exposed in client-side storage | ✓ |

---

## 9. Phase 7 Completion Checklist
- [ ] Install `node-cron` and implement daily notification cron jobs (expiry, birthday)
- [ ] Implement `POST /api/notifications/send`
- [ ] Implement `GET /api/notifications/my`
- [ ] Implement `PUT /api/notifications/:id/read`
- [ ] Implement `GET /api/reports/revenue` with CSV, Excel, PDF export streams
- [ ] Implement `GET /api/reports/attendance` with filters
- [ ] Implement `GET /api/reports/members`
- [ ] Implement `GET /api/reports/weight-progress`
- [ ] Build full Reports Export page (`/admin/reports`) with format selector and preview table
- [ ] Install `papaparse` and `xlsx` for client-side CSV and Excel export
- [ ] Build Notification Bell component in DashboardShell header
- [ ] Build Notification slide-down panel with mark-as-read functionality
- [ ] Build inline expiry warning banners on Member Home
- [ ] Implement mobile responsive sidebar → bottom drawer conversion
- [ ] Wrap all Recharts in `<ResponsiveContainer>`
- [ ] Convert all data tables to card stacks on mobile screens < 640px
- [ ] Add `Suspense` + skeleton loaders to all data-fetching pages
- [ ] Verify QR scanner duplicate-frame cache (5-second in-memory token cache)
- [ ] Run full security audit against the checklist table above
- [ ] Verify database indexes are applied after migration
- [ ] Run end-to-end test: Admin login → create member → scan QR → view attendance log
- [ ] Run end-to-end test: Trainer login → log measurement → assign workout → assign diet
- [ ] Run end-to-end test: Member login → view QR → complete workout → log water intake → download invoice
- [ ] Test all pages at 375px viewport width for mobile usability
- [ ] Validate all PDF exports: correct member data, GST values, invoice numbering
