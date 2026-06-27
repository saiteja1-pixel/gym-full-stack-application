# Core Fit Club — Gym Membership Management System

Core Fit Club is a premium, modern, web-based Gym Membership Management System built using a **Glassmorphic Dark Mode design system** (`glassmorphism`) mixed with vivid neon accents. 

It provides customized role-based portals for Gym Admins, Personal Trainers, and Members to manage profiles, plans, billing, attendance (via secure QR scanner), physical metrics, workout routines, and diet plans.

---

## 🛠️ Technology Stack

*   **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts
*   **API Backend:** Node.js Express, Prisma ORM, JWT Authentication
*   **Payments Backend:** Python FastAPI, SQLAlchemy, Razorpay SDK
*   **Database & Storage:** Supabase PostgreSQL & Supabase Storage

---

## 📁 Repository Structure

```text
full stack application/
├── frontend/             # Next.js client application (Port 3000)
├── backend/              # Node.js Express main API backend (Port 3001)
├── backend-fastapi/      # Python FastAPI payments backend (Port 8000)
├── project requirement/  # Product requirements and system architecture specs
├── development phase/    # Phased roadmap guidelines
├── PRD.md                # System overview and modules PRD
└── design.md             # Complete Technical Design Specification
```

---

## ⚙️ Local Development Setup

Open three separate terminals to start the databases, servers, and frontend client.

### Step 1: Database Setup
Make sure you have your database credentials correctly configured in `backend/.env` and `backend-fastapi/.env`.

In the **main backend directory** (`backend/`), run the migrations and database seed command to deploy the tables and load standard plans and administrator credentials:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

---

### Step 2: Start the Main Express Backend (Port 3001)
The main Express server manages authentication, member CRUD, attendance checking, and trainer schedules.
```bash
cd backend
npm run dev
```
API server will run at: **`http://localhost:3001`**

---

### Step 3: Start the FastAPI Payments Backend (Port 8000)
The payments server handles orders, validation checks, and webhook listeners.
```bash
cd backend-fastapi
# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```
Payments server will run at: **`http://localhost:8000`**

---

### Step 4: Start the Next.js Frontend Client (Port 3000)
Start the user interface portal.
```bash
cd frontend
npm install
npm run dev
```
Client will run at: **`http://localhost:3000`**

---

## 🔑 Pre-Configured Test Accounts

The seed script has pre-loaded test accounts configured with the default password **`CoreFit2026!`**:

1.  **Gym Admin / Owner:**
    *   **Email:** `admin@corefit.com`
    *   **Password:** `CoreFit2026!`
2.  **Trainer:**
    *   **Email:** `trainer@corefit.com`
    *   **Password:** `CoreFit2026!`
3.  **Gym Member:**
    *   **Email:** `tejakarthi65@gmail.com` (or `jane.doe@example.com`)
    *   **Password:** `CoreFit2026!`

---

## 💳 Mock/Sandbox Payments (Development Mode)
If you do not have a verified Razorpay merchant account, you can test the member checkout system safely using the sandbox bypass:
1.  Log in as a member (`tejakarthi65@gmail.com`).
2.  Click **Pay & Renew Online** on the alert bar.
3.  Click the cyan **`Demo Pay (Sandbox Bypass)`** button.
4.  This bypasses the Razorpay widget, creates a valid transaction history row, and instantly activates the gym membership status!
