# Project Requirements Document - Attendance & QR System Module

## 1. Module Overview & Objectives
The Attendance & QR System Module manages contactless check-ins. Members present a unique QR code generated on their dashboard, which is scanned at reception. The system validates their membership status in real time and logs their attendance.

The key objectives are to:
- Replace manual attendance registers with a digital check-in system.
- Securely validate active memberships, expiration dates, and payment statuses.
- Prevent duplicate check-ins within a short timeframe.
- Provide instant visual and audio status indicators for reception staff.

---

## 2. User Roles & Permissions
- **Admin / Receptionist**: Accesses the scanner page and views live check-in logs. The scanner validates members' credentials and creates check-in records.
- **Member**: Accesses and displays their unique check-in QR code on their dashboard. Members *cannot* access the scanning interface or edit attendance logs.
- **Trainer**: Can view attendance logs for their assigned members, but *cannot* access the scanning page.

---

## 3. Database Schema Mapping
The module reads and writes data via the following Prisma models:
- **Member**: Stores the cryptographic QR token (`qrCodeToken`) and user profile details.
- **Membership**: Tracks membership status (`ACTIVE`, `EXPIRED`, `FROZEN`) and end dates.
- **Attendance**: Logs check-in events.
  - `id` (String, Primary Key)
  - `memberId` (String, ForeignKey linked to Member)
  - `checkInTime` (DateTime, defaults to current timestamp)
  - `status` (String, default is "VALID". Stored values: `VALID`, `EXPIRED_PLAN`, `UNPAID`, `DUPLICATE`)
  - `createdAt` (DateTime stamp)

---

## 4. Frontend Route Structure
- **Admin Scanner View**: `[admin/scan/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/admin/scan/page.tsx)`: QR code scanning page. Uses the device camera via `html5-qrcode` to scan and validate member QR codes.
- **Member Dashboard View**: `[member/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/member/page.tsx)`: Renders the member's unique check-in QR code.

---

## 5. Detailed Functional Specifications

### 5.1 Verification Workflow (Sequence Flow)
1. **Member Action**: Opens the member dashboard, which requests and displays their unique QR check-in token.
2. **Scanner Action**: The receptionist uses the scanner page to read the member's QR code.
3. **API Processing**: The scanner page sends a `POST` request with the QR token to the `/api/attendance/scan` endpoint.
4. **Validation Checks**:
   - **Check 1: Token Validity**: Verify if the token matches a registered member.
   - **Check 2: Expiry Date**: Confirm the membership end date is in the future.
   - **Check 3: Plan Status**: Ensure the membership status is set to `ACTIVE`.
   - **Check 4: Payment Status**: Verify the payment status is `PAID` or `PARTIAL`.
   - **Check 5: Duplicate Prevention**: Prevent duplicate entries by blocking consecutive scans within a 60-minute window.
5. **Logging Results**:
   - **Passed**: Logs a `VALID` attendance record and sends a successful response to the frontend.
   - **Failed**: Logs the failure reason (e.g. `EXPIRED_PLAN`, `DUPLICATE`) and sends an error response to the frontend.

### 5.2 UI Overlay & Visual States
Based on the API response, the scanning interface displays a clear visual overlay:
- **Valid Check-In**: A solid emerald green overlay with a checkmark, displaying the member's name, profile photo, and active plan details.
- **Invalid Check-In**: A flashing neon rose red overlay with a warning icon, displaying the denial reason (e.g., "Membership Expired" or "Payment Pending").

---

## 6. Technical Implementations

### 6.1 QR Cryptographic Token Generation Logic
During member registration, the system generates a tamper-proof cryptographically secure hash to prevent QR code duplication:
```javascript
const crypto = require('crypto');

function generateQrToken(memberId, email) {
  // Use a secret salt mixed with unique member properties
  const salt = process.env.QR_SECRET_SALT || 'corefit_secure_salt';
  return crypto
    .createHmac('sha256', salt)
    .update(`${memberId}-${email}-${Date.now()}`)
    .digest('hex');
}
```

### 6.2 html5-qrcode Scanner Component (Frontend)
The scanning page initializes the camera using the `html5-qrcode` library:
```tsx
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

// Initialize scanner overlay inside admin scan page
useEffect(() => {
  const scanner = new Html5QrcodeScanner(
    "reader-element-id",
    { fps: 10, qrbox: { width: 250, height: 250 } },
    /* verbose= */ false
  );

  scanner.render(
    async (decodedText) => {
      // Send token to backend API for verification
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeToken: decodedText })
      });
      const data = await response.json();
      handleScanResult(data);
    },
    (error) => {
      // Handle scanning errors silently
    }
  );

  return () => {
    scanner.clear().catch(err => console.error("Error clearing scanner", err));
  };
}, []);
```

---

## 7. API Specifications

### 7.1 Verify Scan & Record Attendance (`POST /api/attendance/scan`)
- **Headers**: `Authorization: Bearer <Token>` (Role: `ADMIN`)
- **Request Body**:
  ```json
  {
    "qrCodeToken": "abcdef1234567890securetokenvalue"
  }
  ```
- **Success Response (200 - Access Granted)**:
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
- **Error Response (400 - Access Denied)**:
  ```json
  {
    "success": false,
    "status": "DENIED",
    "reason": "Membership Expired / Unpaid",
    "member": {
      "name": "Jane Miller",
      "memberId": "CF-2026-0105"
    }
  }
  ```

---

## 8. Edge Cases & Verification Checklist
- **Duplicate Checks**: Verify that logging scan requests for the same token twice within a 60-minute window returns a `DUPLICATE` status code and does not create multiple attendance records.
- **Offline Scanner Fallback**: If the internet connection drops, the scanner UI must show a prominent connection error alert and cache scans locally until the connection is restored.
- **Invalid Tokens**: Ensure that modified or fake QR codes return a `400 Bad Request` or `404 Not Found` response.
- **Camera Access Permissions**: If camera permissions are denied, the interface should display a user-friendly troubleshooting guide instead of failing silently.
