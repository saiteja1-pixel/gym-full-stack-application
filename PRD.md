# Gym Membership Management System

## Product Requirements Document (PRD)

---

# 1. Project Overview

## Project Name

Gym Membership Management System

## Objective

Develop a modern web-based Gym Membership Management System that helps gym owners manage memberships, payments, attendance, trainers, and member fitness progress through a single platform.

The system should replace manual registers and spreadsheets with a digital solution while providing members with an engaging fitness dashboard.

---

# 2. Tech Stack

## Frontend

* Next.js 15 (App Router)
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* Recharts

## Backend

* Node.js
* Express.js
* Prisma ORM

## Database

* Supabase PostgreSQL

## Storage

* Supabase Storage

## Authentication

* JWT Authentication

## QR

* qrcode
* html5-qrcode

## Payment

* Mock Payment Gateway (Development)
* Razorpay Integration (Future)

## Notifications

* Firebase Cloud Messaging
* Email Support (Future)

---

# 3. User Roles

## Super Admin

* Manage all gyms
* Manage users
* View analytics

## Admin / Owner

* Manage members
* Manage memberships
* View payments
* Scan QR attendance
* Generate reports

## Trainer

* Update workouts
* Update body measurements
* Upload diet plans
* Track member progress

## Member

* View profile
* View QR Code
* Track attendance
* Track weight
* View workouts
* View diet
* Download invoices

---

# 4. Core Modules

## Admin Dashboard

Display

* Total Members
* Active Members
* Expired Members
* Upcoming Renewals
* Today's Entries
* Monthly Revenue
* Pending Payments
* Recent Registrations
* Weight Progress Statistics

---

## Member Management

Admin can

* Add/Edit/Delete Members
* Upload Profile Photo
* Upload ID Proof
* Assign Trainer
* Assign Membership Plan
* Generate QR Code
* Generate Member ID

Member Information

* Name
* Phone
* Email
* DOB
* Gender
* Height
* Weight
* Emergency Contact

---

## Membership Management

Support

* Monthly
* Quarterly
* Half-Year
* Annual
* Custom Plans

Each Plan Includes

* Price
* Duration
* Joining Fee
* GST
* Freeze Days
* Description

Functions

* Create
* Edit
* Delete
* Renew
* Extend
* Upgrade
* Downgrade

---

## Payment Management

Supported Methods

* Cash
* UPI
* Card
* Bank Transfer

Features

* Record Offline Payments
* Mock Online Payment
* Generate Invoice
* Download Receipt
* Payment History
* Pending Payments
* Partial Payments
* Refund Tracking

---

## Attendance System

Every member receives a unique QR Code.

Flow

Member opens QR

↓

Reception scans QR

↓

System validates membership

↓

Attendance recorded

↓

Entry status displayed

Validation

* Active Membership
* Payment Status
* Membership Expiry
* Duplicate Entry Check

---

## Fitness Tracking

Track

* Weight
* Height
* BMI
* Body Fat
* Chest
* Waist
* Hip
* Biceps
* Thigh
* Notes

Generate graphs showing progress over time.

---

## Workout Management

Trainer assigns

* Exercises
* Sets
* Reps
* Weight
* Videos
* Notes

Members can mark workouts as completed.

---

## Diet Management

Trainer creates

* Breakfast
* Lunch
* Dinner
* Snacks

Track

* Calories
* Protein
* Water Intake

---

## Reports

Generate

* Revenue Report
* Attendance Report
* Payment Report
* Member Report
* Weight Progress Report

Export

* PDF
* CSV
* Excel

---

# 5. Member Portal

Members can

* View Profile
* View Membership
* View QR Code
* Track Attendance
* Track Weight
* View Workout Plan
* View Diet Plan
* Download Receipts
* Receive Notifications

---

# 6. Trainer Portal

Trainer can

* View Assigned Members
* Update Weight
* Upload Workout Plans
* Upload Diet Plans
* Add Progress Notes

Trainer cannot access payment information.

---

# 7. Notifications

Automatic reminders for

* Membership Expiry
* Payment Due
* Birthday Wishes
* Gym Announcements
* Trainer Messages

---

# 8. Analytics

Dashboard Charts

* Revenue Trend
* Attendance Trend
* Membership Growth
* Active vs Expired Members
* Weight Progress
* Peak Gym Hours

---

# 9. Database (High-Level)

Tables

* users
* members
* trainers
* memberships
* membership_plans
* attendance
* payments
* invoices
* body_measurements
* workouts
* workout_assignments
* diets
* notifications
* reports

---

# 10. Security

* JWT Authentication
* Role-Based Access Control (RBAC)
* Secure QR Validation
* Password Hashing
* Protected API Routes
* Audit Logs

---

# 11. Future Enhancements

* Multi-Branch Support
* AI Fitness Coach
* Mobile Application
* Referral System
* Coupons & Discounts
* Transformation Gallery
* Achievement Badges
* Wearable Device Integration
* WhatsApp Notifications
* Online Payment Gateway (Razorpay)

---

# 12. Success Criteria

* Reduce manual membership management
* Simplify attendance with QR scanning
* Track member fitness progress visually
* Enable easy payment and renewal management
* Provide a seamless experience for admins, trainers, and members
* Build a scalable foundation for a future SaaS gym management platform
