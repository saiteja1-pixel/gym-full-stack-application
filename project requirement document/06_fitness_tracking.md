# Project Requirements Document - Fitness Tracking Module

## 1. Module Overview & Objectives
The Fitness Tracking Module monitors member progress by recording and analyzing key physical measurements over time. It provides a visual transformation log for members and trainers to track changes in weight, body fat percentage, body mass index (BMI), and circumference dimensions.

The key objectives are to:
- Establish a structured framework for recording physical metrics.
- Automate BMI calculations.
- Display transformation progress on interactive, premium charts.
- Allow trainers to capture detailed progression logs.

---

## 2. User Roles & Permissions
- **Trainer**: Can record and log physical measurements for assigned members, add progression notes, and view comparative progress charts.
- **Member**: Can view personal physical measurements, progress charts, and trends. Members *cannot* manually log or edit baseline metrics inside the primary tracking tables to prevent data falsification.
- **Admin**: Can view progress logs and reports.

---

## 3. Database Schema Mapping
The module reads and writes data via the **BodyMeasurement** Prisma model:

### 3.1 BodyMeasurement Model
- `id` (String, Primary Key)
- `memberId` (String, ForeignKey linked to Member)
- `logDate` (DateTime, defaults to current timestamp)
- `weight` (Float, stored in kg)
- `height` (Float, stored in cm)
- `bmi` (Float, auto-computed)
- `bodyFat` (Float, Optional, stored in %)
- `chest` (Float, Optional, stored in inches)
- `waist` (Float, Optional, stored in inches)
- `hip` (Float, Optional, stored in inches)
- `biceps` (Float, Optional, stored in inches)
- `thigh` (Float, Optional, stored in inches)
- `notes` (String, Optional trainer comments)
- `createdAt` (DateTime stamp)

---

## 4. Frontend Route Structure
- **Trainer Editor Panel**: `[trainer/members/[id]/measurements/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/trainer/members/%5Bid%5D/measurements/page.tsx)`: Form interface with parameter check-fields and history lists.
- **Member Dashboard Panel**: `[member/progress/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/member/progress/page.tsx)`: Detailed charts (Recharts line curves), BMI indicators, and historical logs.

---

## 5. Detailed Functional Specifications

### 5.1 Physical Metrics Checklist
The tracking dashboard monitors the following metrics:
- **Baseline Metrics**: Height (cm), Weight (kg), and BMI.
- **Body Fat Composition**: Body Fat Percentage (%).
- **Body Circumferences**: Chest, Waist, Hips, Biceps, Thighs (all in inches).

### 5.2 BMI Computation Logic
Every time a trainer enters new weight or height values, the backend API automatically computes the Body Mass Index (BMI):
$$\text{BMI} = \frac{\text{Weight (kg)}}{\left(\frac{\text{Height (cm)}}{100}\right)^2}$$
*Example: Weight = 75 kg, Height = 175 cm.*
$$\text{BMI} = \frac{75}{(1.75)^2} = \frac{75}{3.0625} \approx 24.49$$

### 5.3 Premium Visualization Engine (Recharts Integration)
Progress reports render data using customized Recharts charts with a glassmorphic design:
- **Line Customizations**:
  - Weight and Body Fat trends are displayed on dual-axis line charts.
  - Features neon purple (`var(--primary)`) and neon cyan (`var(--secondary)`) gradient fills underneath the curve.
- **Custom Tooltip component**:
  - A custom tooltip component shows detailed data points on hover.
  - Rendered using a translucent black background, blurred card boundaries (`backdrop-blur-md`), and a subtle white border (`border-white/10`).
- **Interactive Interval Filters**:
  - Allows filtering data by time intervals: Last 30 Days, Last 3 Months, Last 6 Months, or All-Time.

---

## 6. API Specifications

### 6.1 Create Measurement Entry (`POST /api/fitness/measurements`)
- **Headers**: `Authorization: Bearer <Token>` (Role: `TRAINER`)
- **Request Body**:
  ```json
  {
    "memberId": "member-uuid-xyz",
    "weight": 78.5,
    "height": 180.0,
    "bodyFat": 14.5,
    "chest": 38.2,
    "waist": 32.0,
    "hip": 38.0,
    "biceps": 14.0,
    "thigh": 22.5,
    "notes": "Post-cut baseline measurements."
  }
  ```
- **Backend Flow**:
  1. Read inputs.
  2. Perform BMI calculations.
  3. Start a database transaction.
  4. Write log parameters to the `BodyMeasurement` table.
  5. Commit transaction.
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "measurement": {
      "id": "log-uuid-777",
      "logDate": "2026-06-25T13:46:00.000Z",
      "bmi": 24.23
    }
  }
  ```

### 6.2 Fetch Member Progression Logs (`GET /api/fitness/progress/:memberId`)
- **Headers**: `Authorization: Bearer <Token>` (Role: `MEMBER` or `TRAINER` or `ADMIN`)
- **Success Response (200)**:
  ```json
  {
    "history": [
      {
        "logDate": "2026-05-25T08:30:00.000Z",
        "weight": 80.0,
        "height": 180.0,
        "bmi": 24.69,
        "bodyFat": 15.2,
        "waist": 33.0
      },
      {
        "logDate": "2026-06-25T08:30:00.000Z",
        "weight": 78.5,
        "height": 180.0,
        "bmi": 24.23,
        "bodyFat": 14.5,
        "waist": 32.0
      }
    ]
  }
  ```

---

## 7. UX Component Specifications (Recharts Customization)
Custom React component configurations for rendering the line chart tooltips:
```tsx
const CustomGlassTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border border-white/10 rounded-lg shadow-2xl backdrop-blur-md">
        <p className="text-white/60 text-xs mb-1 font-semibold">
          {new Date(label).toLocaleDateString()}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value} {entry.name === 'Weight' ? 'kg' : '%'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
```

---

## 8. Edge Cases & Verification Checklist
- **Metric Fallbacks**: If metrics like Body Fat or biceps are missing, the progress charts ignore those data points instead of rendering zero value dips.
- **Sanity Limits**: Add input validators to restrict measurement values to realistic ranges (e.g. Weight: 30kg - 300kg, Height: 100cm - 250cm).
- **Scale Responsiveness**: Ensure charts adjust sizing dynamically to remain readable on mobile device screens.
- **Calculation precision**: Validate that computed BMI values are stored as floating-point decimals rounded to two decimal places.
