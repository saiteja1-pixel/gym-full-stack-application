# Project Requirements Document - Admin Module

## 1. Module Overview & Objectives
The Admin Module serves as the command center for Gym Owners, Admins, and Super Admins. It streamlines business operations by digitizing member management, plan setups, billing/invoicing, check-in operations, and financial reporting. 

The primary objectives are to:
- Eliminate spreadsheet-based tracking.
- Provide real-time operational insights (active vs. expired memberships, revenue, attendance).
- Securely register and manage member profiles and documents.
- Process membership transactions, upgrades, and freezes.
- Generate and export accounting and attendance reports.

---

## 2. User Roles & Permissions
- **Super Admin**: Has global privileges. Can manage all gym branches (multi-branch support structure), edit/delete users across all databases, and view comprehensive global business analytics.
- **Admin / Owner**: Can manage members, configure membership plans, scan QR codes for attendance, record payments, and export reports for their specific branch. Trainers and members cannot access these functions.

---

## 3. Database Schema Mapping
The Admin Module directly interacts with the following Prisma models defined in the database:

- **Admin**: Tracks branch details and user links.
- **Member**: Handles personal information, avatar, ID proof URL, unique QR tokens, and trainer assignments.
- **MembershipPlan**: Standardized templates for subscriptions (Monthly, Annual, etc.) detailing pricing, duration, and taxes.
- **Membership**: The active subscription instances assigned to members.
- **Payment**: Financial ledger records including invoice details and payment methods.

---

## 4. Frontend Route Structure
Admins navigate through the Next.js App Router under the `/admin` path:
- `[admin/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/admin/page.tsx)`: Dashboard Analytics & Charts.
- `[admin/members/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/admin/members/page.tsx)`: Interactive member listing and filter grid.
- `[admin/members/new/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/admin/members/new/page.tsx)`: Registration form (photo capture, ID upload, QR issuance).
- `[admin/members/[id]/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/admin/members/[id]/page.tsx)`: Member profile inspection, trainer assignments, and plan upgrades.
- `[admin/memberships/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/admin/memberships/page.tsx)`: Plan creation and configuration management.
- `[admin/payments/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/admin/payments/page.tsx)`: Invoicing ledger and mock billing interface.
- `[admin/reports/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/admin/reports/page.tsx)`: PDF/CSV exports interface.

---

## 5. Detailed Functional Specifications

### 5.1 Admin Dashboard
- **Analytics Metrics Cards**: Display dynamic counts of:
  - *Total Members* and *Active Members* (Emerald Glow)
  - *Expired Members* (Rose Glow)
  - *Upcoming Renewals* (within 7 days) and *Today's Entries* (Cyan Glow)
  - *Monthly Revenue* and *Pending Payments* (Amber Glow)
- **Charts Integration**:
  - **Revenue Trend Line Chart**: Renders monthly invoicing progress utilizing Recharts with neon purple gradients and glassmorphic tooltips.
  - **Membership Distribution**: Donut chart highlighting Active vs. Expired vs. Frozen subscriptions.
  - **Activity Log Feed**: Real-time list showing recent check-ins, membership renewals, and registrations.

### 5.2 Member Management Workflow
1. **Creation**:
   - Fields: Name, Phone, Email, DOB, Gender, Emergency Contact, Initial Height (cm), Initial Weight (kg).
   - Relations: Assign Trainer (optional dropdown), Assign Plan (dropdown).
   - Document Upload: Profile avatar image, ID Proof (PDF/JPG) uploaded directly to Supabase Storage buckets.
2. **ID and QR Generation**:
   - System automatically generates a sequential human-readable `memberId` (e.g., `CF-2026-0001`).
   - System triggers QR Cryptographic token generation based on member details and a secure environment secret.
3. **Edit / Delete**:
   - Profile information update.
   - Assign/reassign trainers, extend memberships, or freeze accounts.

### 5.3 Membership Plan Configurator
- Allows managing different packages (Monthly, Quarterly, Semi-Annual, Annual, Custom).
- Attributes: Base Price, Duration (in exact days), Joining Fee, GST percentage (default 18.0%), Freeze Days allowed, and Plan Description.
- Operations: **Upgrade** (calculates pro-rata adjustments), **Downgrade** (schedules plan changes at the end of current cycle), and **Freeze** (suspends membership status and shifts the expiration date forward).

### 5.4 Invoicing & Payments
- Record manual offline payments (Cash, UPI, Card, Bank Transfer) or test online payments through a mock gateway.
- Structure invoices dynamically:
  - Generate unique `invoiceNumber` (e.g., `INV-2026-0001`).
  - Calculate `taxAmount` (based on GST) and `totalAmount` (base price + joining fee + tax).
  - Issue PDF invoices instantly.

---

## 6. API Specifications

### 6.1 Create Member (`POST /api/admin/members`)
- **Headers**: `Authorization: Bearer <Token>` (Requires `ADMIN` or `SUPER_ADMIN` role)
- **Request Body**:
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
- **Execution Steps**:
  1. Verify if email already exists in `User` table.
  2. Hash a default password (e.g., `CoreFit2026!`) using bcrypt.
  3. Start a database transaction.
  4. Create `User` record with role `MEMBER`.
  5. Generate a cryptographic HMAC hash for the QR check-in token.
  6. Calculate membership dates based on `durationDays` specified in `MembershipPlan`.
  7. Insert `Member` and associate a new `Membership` instance.
  8. Commit transaction.
- **Success Response (201)**:
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

### 6.2 Get Member Listing (`GET /api/admin/members`)
- **Query Parameters**: `search=John&status=ACTIVE&page=1&limit=10`
- **Success Response (200)**:
  ```json
  {
    "members": [
      {
        "id": "member-uuid-xyz",
        "memberId": "CF-2026-0001",
        "name": "John Doe",
        "phone": "9876543210",
        "membership": {
          "status": "ACTIVE",
          "endDate": "2026-12-31T00:00:00.000Z",
          "plan": { "name": "Gold Annual Package" }
        }
      }
    ],
    "totalPages": 5,
    "currentPage": 1
  }
  ```

### 6.3 Record Payment & Issue Invoice (`POST /api/payments/invoice`)
- **Request Body**:
  ```json
  {
    "memberId": "member-uuid-xyz",
    "planId": "plan-uuid-5678",
    "amountPaid": 11800.0,
    "totalAmount": 11800.0,
    "taxAmount": 1800.0,
    "method": "UPI",
    "notes": "Annual plan renewal"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "invoice": {
      "invoiceNumber": "INV-2026-0042",
      "paymentDate": "2026-06-25T13:46:00.000Z",
      "status": "PAID"
    }
  }
  ```

---

## 7. Mock PDF Invoice Generation Algorithm
For generating invoice files on the client side, use `jspdf` and `jspdf-autotable`. The rendering structure must match the glassmorphic Obsidian branding:
```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportInvoicePdf = (payment: any, member: any) => {
  const doc = new jsPDF();
  
  // Header background block in Obsidian dark style
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Header text - Cyan neon signature
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(22);
  doc.text('CORE FIT CLUB - INVOICE', 14, 30);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Invoice: ${payment.invoiceNumber}`, 140, 20);
  doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 140, 28);
  
  // Billing details section
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.text('Billed To:', 14, 70);
  doc.setFont('Helvetica', 'Bold');
  doc.text(member.name, 14, 78);
  doc.setFont('Helvetica', 'Normal');
  doc.text(`Phone: ${member.phone}`, 14, 84);
  doc.text(`Email: ${member.user.email}`, 14, 90);
  
  // Invoiced items table details
  const columns = ["Description", "Quantity", "Tax Rate (GST)", "Total Price (INR)"];
  const rows = [
    [payment.notes || "Gym Membership Subscription Fee", "1", "18%", `${payment.totalAmount.toFixed(2)}`]
  ];
  
  (doc as any).autoTable({
    startY: 100,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237] }, // Purple primary accent
    styles: { fontSize: 10 }
  });
  
  doc.save(`${payment.invoiceNumber}.pdf`);
};
```

---

## 8. Verification & QA Checklist
1. **Transaction Integrity**: Verify that if user registration fails (e.g. invalid phone format), the billing/payment records are rolled back in the DB transaction.
2. **Document Check**: Verify that uploaded avatars and IDs are stored under corresponding branch directories inside the Supabase Storage bucket.
3. **Pro-rata Computations**: Double-check membership calculations when upgrading plans mid-month to prevent billing leakage.
4. **PDF Output styling**: Verify that the generated invoice document renders correct values, GST proportions, and is saved with the transaction receipt index identifier format.
