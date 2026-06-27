# Phase 4 — Attendance & QR System

> **Goal:** Implement the complete contactless QR-based attendance system — including cryptographic token security, the member-facing QR display widget, the admin-facing camera scanner page, real-time validation logic (5 checks), duplicate prevention, and high-contrast visual status overlays.
>
> **Depends on:** Phase 1 (Auth, schema), Phase 2 (Members registered with qrCodeToken)

**Source PRDs:**
- [07_attendance_and_qr_system.md](file:///c:/Users/HP/Downloads/full stack application/project requirement document/07_attendance_and_qr_system.md)
- [02_customer_panel.md §5.2](file:///c:/Users/HP/Downloads/full stack application/project requirement document/02_customer_panel.md)
- [design.md §6.1 (QR Workflow Diagram)](file:///c:/Users/HP/Downloads/full stack application/design.md)

---

## 1. Scope & Objectives
- Members display a **unique cryptographic QR code** on their portal.
- Admin/receptionist uses a **camera-based scanner** page to scan QR codes.
- System validates the scan against **5 sequential checks**.
- Logs `VALID` or `DENIED` attendance records in the `Attendance` table.
- Displays instant **neon visual overlays** on the scanner screen:
  - ✅ Emerald green card = access granted.
  - ❌ Flashing rose red card = access denied.
- **Block duplicate** scans within a 60-minute window.
- Trainer can view attendance logs for their assigned members.

---

## 2. Database Models Involved
| Model | Operations |
|---|---|
| `Attendance` | CREATE, READ |
| `Member` | READ (match by `qrCodeToken`) |
| `Membership` | READ (validate status, dates) |
| `Payment` | READ (validate payment status) |

### Attendance Model Fields
```prisma
model Attendance {
  id          String   @id @default(uuid())
  memberId    String
  member      Member   @relation(...)
  checkInTime DateTime @default(now())
  status      String   @default("VALID")
  // Stored values: VALID | EXPIRED_PLAN | UNPAID | DUPLICATE | FROZEN | INVALID_TOKEN
  createdAt   DateTime @default(now())

  @@index([memberId, checkInTime])
}
```

---

## 3. Cryptographic QR Token

### 3.1 Token Generation (runs at member registration in Phase 2)
```javascript
// utils/generateQrToken.js
const crypto = require('crypto');

function generateQrToken(memberId, email) {
  const salt = process.env.QR_SECRET_SALT || 'corefit_secure_salt';
  return crypto
    .createHmac('sha256', salt)
    .update(`${memberId}-${email}-${Date.now()}`)
    .digest('hex');
}

module.exports = { generateQrToken };
```
- Token is stored in `Member.qrCodeToken` (unique, indexed).
- Token never changes after generation (unless admin resets it).

### 3.2 Token Security Properties
- HMAC-SHA256 produces a 64-character hex string.
- Tamper-proof: Cannot be reverse-engineered to reveal member data.
- Unique salt ensures tokens are not predictable across members.

---

## 4. Backend API Endpoints

### 4.1 `POST /api/attendance/scan` — Validate QR & Record Attendance
- **Requires:** `ADMIN` or `SUPER_ADMIN`
- **Body:**
  ```json
  { "qrCodeToken": "abcdef1234567890securetokenvalue" }
  ```
- **Validation Sequence (5 Checks):**

  | Check | Condition | Failure Status |
  |---|---|---|
  | 1. Token Valid | Token matches a Member in DB | `INVALID_TOKEN` |
  | 2. Expiry Date | `Membership.endDate >= today` | `EXPIRED_PLAN` |
  | 3. Plan Status | `Membership.status === ACTIVE` | `FROZEN` or `CANCELLED` |
  | 4. Payment Check | Latest Payment `status === PAID or PARTIAL` | `UNPAID` |
  | 5. Duplicate Check | No `Attendance` record for this member in last 60 minutes | `DUPLICATE` |

- **On Pass — Create record:**
  ```javascript
  await prisma.attendance.create({
    data: { memberId: member.id, status: 'VALID' }
  });
  ```
- **On Fail — Create denial record:**
  ```javascript
  await prisma.attendance.create({
    data: { memberId: member.id, status: failureStatus }
  });
  ```
- **Success Response (200 — VALID):**
  ```json
  {
    "success": true,
    "status": "VALID",
    "member": {
      "name": "Jane Miller",
      "memberId": "CF-2026-0105",
      "avatarUrl": "https://storage.supabase.co/avatars/jane.jpg"
    },
    "membership": {
      "planName": "Platinum Annual Package",
      "endDate": "2026-12-31T23:59:59.000Z"
    }
  }
  ```
- **Error Response (400 — DENIED):**
  ```json
  {
    "success": false,
    "status": "DENIED",
    "reason": "Membership Expired",
    "denialCode": "EXPIRED_PLAN",
    "member": { "name": "Jane Miller", "memberId": "CF-2026-0105" }
  }
  ```

### 4.2 `GET /api/attendance/logs` — Fetch Attendance Logs
- **Requires:** `ADMIN`, `SUPER_ADMIN`, `TRAINER`
- **Query:** `?memberId=uuid&startDate=2026-06-01&endDate=2026-06-30&status=VALID`
- **Response (200):** Paginated flat array of attendance records with member name and membership details.

---

## 5. Frontend Routes & Pages

### 5.1 `src/app/(dashboard)/admin/scan/page.tsx` — Admin QR Scanner
**Layout:**
- Large **Camera Viewport** centered on the page with a QR box target overlay.
- **Status Panel** below camera (shows "Ready to Scan" by default).
- **Live Scan Log** sidebar showing last 10 scans with member names and timestamps.

**Scanner Implementation (html5-qrcode):**
```tsx
// Install: npm install html5-qrcode
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef } from 'react';

useEffect(() => {
  const scanner = new Html5QrcodeScanner(
    'qr-reader',
    { fps: 10, qrbox: { width: 250, height: 250 } },
    false
  );

  scanner.render(
    async (decodedToken) => {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrCodeToken: decodedToken })
      });
      const data = await res.json();
      handleScanResult(data);  // Sets overlay state
    },
    (error) => { /* silent */ }
  );

  return () => scanner.clear();
}, []);
```

**UI Overlays based on scan result:**

**Valid Access (Emerald Overlay):**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  className="absolute inset-0 bg-emerald-500/20 border-2 border-emerald-400 rounded-2xl flex flex-col items-center justify-center"
>
  <CheckCircle className="text-emerald-400 h-16 w-16" />
  <h2 className="text-2xl font-bold text-emerald-300">{result.member.name}</h2>
  <p className="text-emerald-200/70">{result.membership.planName}</p>
  <p className="text-sm text-white/50">Valid until: {result.membership.endDate}</p>
</motion.div>
```

**Access Denied (Rose Pulsing Overlay):**
```tsx
<motion.div
  animate={{ opacity: [1, 0.5, 1] }}
  transition={{ repeat: 3, duration: 0.5 }}
  className="absolute inset-0 bg-rose-500/20 border-2 border-rose-400 rounded-2xl flex flex-col items-center justify-center"
>
  <XCircle className="text-rose-400 h-16 w-16" />
  <h2 className="text-2xl font-bold text-rose-300">Access Denied</h2>
  <p className="text-rose-200/70">{result.reason}</p>
</motion.div>
```

**Camera Permission Error:**
- If camera is denied, show a troubleshooting guide card explaining how to grant browser camera access.

**Offline State:**
- Detect `navigator.onLine = false` → display amber alert banner: "No internet connection. Scan results cannot be validated."

### 5.2 `src/app/(dashboard)/member/page.tsx` — Member Home & QR Display
**QR Widget (Glassmorphic Card):**
- Renders the member's `qrCodeToken` as a QR code image using `qrcode.react`.
- Display member name, ID, and plan status below the QR.
- **Do NOT** store the token in localStorage. Fetch fresh from `/api/auth/me` on each component mount.

**Plan Status Alert:**
- If `Membership.status === EXPIRED`: Show flashing rose banner — "Your membership has expired. Please renew."
- If `Membership.status === FROZEN`: Show amber banner — "Membership frozen. Resumes on [date]."

**Quick Stats Row:**
- Circular gauges: Workout completion %, Today's calorie progress, Water intake progress.

---

## 6. Duplicate Scan Prevention Logic (Backend)
```javascript
// Check for existing scan within 60 minutes
const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
const recentScan = await prisma.attendance.findFirst({
  where: {
    memberId: member.id,
    checkInTime: { gte: sixtyMinutesAgo },
    status: 'VALID'
  }
});

if (recentScan) {
  // Create DUPLICATE log and return denied response
}
```

---

## 7. Phase 4 Completion Checklist
- [ ] Ensure `qrCodeToken` is stored on `Member` creation (Phase 2 prerequisite)
- [ ] Write `generateQrToken` utility function using HMAC-SHA256
- [ ] Implement `POST /api/attendance/scan` with all 5 sequential validation checks
- [ ] Implement duplicate check query (60-minute window)
- [ ] Implement `GET /api/attendance/logs` with filters
- [ ] Install `html5-qrcode` and configure scanner on admin scan page
- [ ] Build Admin Scanner page (`/admin/scan`) with camera viewport and live scan log
- [ ] Build valid access Emerald overlay component
- [ ] Build denied access Rose pulsing overlay component
- [ ] Add camera permission error fallback screen
- [ ] Add offline state detection with amber alert banner
- [ ] Install `qrcode.react` and build QR display widget on Member Home page
- [ ] Implement fresh token fetch on component mount (no localStorage caching)
- [ ] Add expired/frozen membership banner alerts on Member Home
- [ ] Test: Scan valid member → see green overlay → log `VALID` in DB
- [ ] Test: Scan same member again within 60 mins → see denial → log `DUPLICATE` in DB
- [ ] Test: Scan expired member → see rose overlay with `EXPIRED_PLAN` reason
- [ ] Test: Scan token not in DB → return `INVALID_TOKEN` 404 response
