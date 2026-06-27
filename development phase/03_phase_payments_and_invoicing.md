# Phase 3 — Payments & Invoicing

> **Goal:** Build the complete financial management system — recording offline/mock payments (Cash, UPI, Card, Bank Transfer), auto-generating unique invoice numbers, calculating GST, producing downloadable PDF invoices, and displaying a payment ledger to admins and payment history to members.
>
> **Depends on:** Phase 1 (Auth), Phase 2 (Members + Membership Plans exist)

**Source PRDs:**
- [01_admin_module.md §5.4, §6.3, §7](file:///c:/Users/HP/Downloads/full stack application/project requirement document/01_admin_module.md)
- [02_customer_panel.md §5 (invoices)](file:///c:/Users/HP/Downloads/full stack application/project requirement document/02_customer_panel.md)
- [design.md §4.2 (Financials), §7 (PDF Export)](file:///c:/Users/HP/Downloads/full stack application/design.md)

---

## 1. Scope & Objectives
- Record manual **offline payments** (Cash, UPI, Card, Bank Transfer).
- Simulate **mock online payment** gateway flow.
- Auto-generate sequential **invoice numbers** (format: `INV-2026-0001`).
- Calculate `taxAmount` from `gstPercent` on the plan's base price + joining fee.
- Produce downloadable **PDF invoices** with gym branding (dark theme, neon accents).
- Display **Payment Ledger** to Admin with filters, revenue summaries.
- Allow **Members** to view their payment history and download invoice PDFs.

---

## 2. Database Models Involved
| Model | Operations |
|---|---|
| `Payment` | CREATE, READ |
| `Membership` | UPDATE `status` on payment |
| `Member` | READ (for billing details on invoice) |
| `MembershipPlan` | READ (for pricing and GST values) |

### Payment Model Fields
```prisma
model Payment {
  id            String        @id @default(uuid())
  memberId      String
  member        Member        @relation(...)
  invoiceNumber String        @unique  // INV-2026-XXXX
  amountPaid    Float
  totalAmount   Float         // base + joining fee + GST
  taxAmount     Float         // GST portion
  paymentDate   DateTime      @default(now())
  status        PaymentStatus // PAID | PENDING | PARTIAL | REFUNDED
  method        PaymentMethod // CASH | UPI | CARD | BANK_TRANSFER
  notes         String?
  createdAt     DateTime      @default(now())
}
```

---

## 3. Backend API Endpoints

### 3.1 `POST /api/payments/invoice` — Record Payment & Issue Invoice
- **Requires:** `ADMIN` or `SUPER_ADMIN`
- **Body:**
  ```json
  {
    "memberId": "member-uuid-xyz",
    "planId": "plan-uuid-5678",
    "amountPaid": 11800.00,
    "totalAmount": 11800.00,
    "taxAmount": 1800.00,
    "method": "UPI",
    "notes": "Annual plan renewal - June 2026"
  }
  ```
- **Execution Logic:**
  1. Generate sequential `invoiceNumber`:
     - Query `Payment` table for latest `INV-{YYYY}-XXXX` → increment by 1.
  2. Create `Payment` record.
  3. Update linked `Membership.status = ACTIVE` if `status = PAID`.
  4. Return invoice details.
- **Success Response (200):**
  ```json
  {
    "success": true,
    "invoice": {
      "invoiceNumber": "INV-2026-0042",
      "paymentDate": "2026-06-25T13:46:00.000Z",
      "status": "PAID",
      "amountPaid": 11800.00,
      "taxAmount": 1800.00
    }
  }
  ```

### 3.2 `GET /api/payments/ledger` — Admin Payment Ledger
- **Requires:** `ADMIN`, `SUPER_ADMIN`
- **Query:** `?startDate=2026-01-01&endDate=2026-06-30&status=PAID&method=UPI`
- **Response (200):**
  ```json
  {
    "transactions": [
      { "invoiceNumber": "INV-2026-0042", "memberName": "John Doe", "amountPaid": 11800.00, "method": "UPI", "paymentDate": "...", "status": "PAID" }
    ],
    "summary": {
      "totalRevenue": 250000.00,
      "totalPending": 15000.00,
      "totalTransactions": 42
    },
    "monthlyRevenue": [
      { "month": "Jan", "revenue": 45000.00 },
      { "month": "Feb", "revenue": 52000.00 }
    ]
  }
  ```

### 3.3 `GET /api/payments/member/:memberId` — Member Payment History
- **Requires:** Linked `MEMBER` or `ADMIN`/`SUPER_ADMIN`
- **Response (200):** Array of payment records for the member.

---

## 4. Frontend Routes & Pages

### 4.1 `src/app/(dashboard)/admin/page.tsx` — Admin Analytics Dashboard
**Stats Cards (Row 1):**
| Metric | Color Accent | Icon |
|---|---|---|
| Total Members | Purple | Users |
| Active Members | Emerald | UserCheck |
| Expired Members | Rose | UserX |
| Upcoming Renewals (7 days) | Amber | Calendar |
| Today's Check-Ins | Cyan | QrCode |
| Monthly Revenue (current month) | Purple | DollarSign |
| Pending Payments | Amber | AlertTriangle |

**Charts Section:**

**Revenue Trend Line Chart (Recharts):**
- X-axis: Months, Y-axis: Revenue in ₹.
- Neon purple gradient area fill underneath the curve.
- Custom glassmorphic tooltip on hover.
- Data sourced from `GET /api/payments/ledger`.

**Membership Distribution Donut Chart:**
- Shows Active vs Expired vs Frozen member counts.
- Neon purple, rose, amber color segments.
- Legend below with percentages.

**Recent Activity Feed:**
- Last 10 events (registrations, renewals, check-ins) sorted by timestamp.
- Each item shows: icon, event type, member name, timestamp.

### 4.2 `src/app/(dashboard)/admin/payments/page.tsx` — Payment Ledger
**UI Elements:**
- **Summary bar:** Total Revenue, Pending Amount, Total Invoices (cards).
- **Filters:** Date range picker, Status dropdown (All/PAID/PENDING/PARTIAL/REFUNDED), Payment Method dropdown.
- **Transactions Table:** Invoice #, Member Name, Amount, Tax, Method, Status badge, Date, Actions (View Invoice, Download PDF).
- **Record Payment** button → opens a form modal:
  - Select Member (searchable), Select Plan, Amount Paid, Payment Method, Notes.
  - Computes and displays GST breakdown before submission.

### 4.3 `src/app/(dashboard)/admin/reports/page.tsx` — Reports & Export
**Export Options:**
- **Revenue Report:** Date range → Export CSV, Excel, or PDF.
- **Attendance Report:** Date range, member filter → Export CSV.
- **Member Report:** Active/Expired breakdown → Export Excel.
- **Payment Report:** Method, status filters → Export PDF.

### 4.4 `src/app/(dashboard)/member/invoices/page.tsx` — Member Invoice History
**UI Elements:**
- List of past payments with: Invoice #, Date, Plan Name, Amount, Status badge.
- **Download PDF** button per invoice.

---

## 5. PDF Invoice Generation (Client-Side with jsPDF)
Install: `npm install jspdf jspdf-autotable`

```typescript
// src/lib/exportInvoicePdf.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportInvoicePdf = (payment: any, member: any) => {
  const doc = new jsPDF();

  // Dark header block
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, 210, 50, 'F');

  // Gym name in neon cyan
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(22);
  doc.text('CORE FIT CLUB — INVOICE', 14, 30);

  // Invoice metadata (white text)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Invoice: ${payment.invoiceNumber}`, 140, 20);
  doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 140, 28);

  // Member billing info
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.text('Billed To:', 14, 70);
  doc.setFont('Helvetica', 'Bold');
  doc.text(member.name, 14, 78);
  doc.setFont('Helvetica', 'Normal');
  doc.text(`Phone: ${member.phone}`, 14, 84);
  doc.text(`Email: ${member.user.email}`, 14, 90);
  doc.text(`Member ID: ${member.memberId}`, 14, 96);

  // Line items table
  (doc as any).autoTable({
    startY: 110,
    head: [['Description', 'Qty', 'GST Rate', 'Total Amount (INR)']],
    body: [[
      payment.notes || 'Gym Membership Subscription Fee',
      '1',
      '18%',
      `₹${payment.totalAmount.toFixed(2)}`
    ]],
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237] }, // Neon purple
    styles: { fontSize: 10 },
    footStyles: { fillColor: [240, 240, 250] }
  });

  // GST breakdown
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Subtotal: ₹${(payment.totalAmount - payment.taxAmount).toFixed(2)}`, 140, finalY);
  doc.text(`GST (18%): ₹${payment.taxAmount.toFixed(2)}`, 140, finalY + 6);
  doc.setFont('Helvetica', 'Bold');
  doc.text(`Total: ₹${payment.totalAmount.toFixed(2)}`, 140, finalY + 14);

  doc.save(`${payment.invoiceNumber}.pdf`);
};
```

---

## 6. GST Calculation Logic
```
basePrice    = MembershipPlan.price + MembershipPlan.joiningFee
taxAmount    = basePrice * (gstPercent / 100)   // e.g. 18%
totalAmount  = basePrice + taxAmount
```

---

## 7. Phase 3 Completion Checklist
- [ ] Implement `POST /api/payments/invoice` with sequential `invoiceNumber` generation
- [ ] Implement GST computation within payment API (basePrice + joining fee + 18% GST)
- [ ] Implement `GET /api/payments/ledger` with date/status/method filters and monthly revenue grouping
- [ ] Implement `GET /api/payments/member/:memberId` for member invoice history
- [ ] Build Admin Analytics Dashboard page (`/admin`) with 7 stats cards
- [ ] Build Revenue Trend Line Chart (Recharts) with neon purple gradient fill
- [ ] Build Membership Distribution Donut Chart
- [ ] Build Recent Activity Feed component
- [ ] Build Payment Ledger page (`/admin/payments`) with filters, table, and Record Payment modal
- [ ] Build Reports & Export page (`/admin/reports`) with CSV, Excel, PDF download options
- [ ] Implement `exportInvoicePdf` utility with full jsPDF + jspdf-autotable implementation
- [ ] Build Member Invoice History page (`/member/invoices`) with PDF download triggers
- [ ] Test PDF invoice output: Verify correct values, GST breakdown, and file naming
- [ ] Verify role gates: Trainer cannot access `/api/payments/ledger`
